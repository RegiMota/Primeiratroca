import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { EmailService } from '../services/EmailService';
import { authRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimit';
import { TwoFactorService } from '../services/TwoFactorService';
import { verifyRecaptcha } from '../middleware/recaptcha';
import { AuditService } from '../services/AuditService';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'primeira-troca-secret-key-change-in-production';

// Register - com rate limiting e reCAPTCHA
router.post('/register', authRateLimiter, verifyRecaptcha, async (req, res) => {
  try {
    const { name, email, password, cpf, birthDate } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Verificar se CPF já está cadastrado (se fornecido)
    if (cpf) {
      const existingCpf = await prisma.user.findFirst({
        where: { cpf: cpf.replace(/\D/g, '') },
      });

      if (existingCpf) {
        return res.status(400).json({ error: 'CPF já cadastrado' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Preparar dados do usuário
    const userData: any = {
      name,
      email,
      password: hashedPassword,
      isAdmin: false,
    };

    // Adicionar CPF se fornecido
    if (cpf) {
      userData.cpf = cpf.replace(/\D/g, ''); // Remove formatação
    }

    // Adicionar data de aniversário se fornecida
    if (birthDate) {
      userData.birthDate = new Date(birthDate);
    }

    // Create user
    const user = await prisma.user.create({
      data: userData,
    });

    // Send registration confirmation email
    try {
      await EmailService.sendRegistrationConfirmation(user.email, user.name);
    } catch (error) {
      console.error('Error sending registration email:', error);
      // Don't fail registration if email fails
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        cpf: user.cpf || undefined,
        birthDate: user.birthDate || undefined,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

// Login - com rate limiting e reCAPTCHA
router.post('/login', authRateLimiter, verifyRecaptcha, async (req, res) => {
  try {
    const { email, password, twoFactorToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      // Registrar tentativa de login falhada (não bloquear se falhar)
      try {
        await AuditService.log({
          userEmail: email,
          action: 'login_failed',
          resourceType: 'auth',
          details: { reason: 'invalid_password' },
          ipAddress: req.ip || req.socket.remoteAddress || undefined,
          userAgent: req.get('user-agent') || undefined,
        });
      } catch (auditError) {
        console.warn('Failed to log audit (continuing):', auditError);
      }
      
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar 2FA se habilitado
    if (user.isTwoFactorEnabled) {
      if (!twoFactorToken) {
        // Registrar tentativa de login sem 2FA (não bloquear se falhar)
        try {
          await AuditService.log({
            userId: user.id,
            userEmail: user.email,
            action: 'login_2fa_required',
            resourceType: 'auth',
            ipAddress: req.ip || req.socket.remoteAddress || undefined,
            userAgent: req.get('user-agent') || undefined,
          });
        } catch (auditError) {
          console.warn('Failed to log audit (continuing):', auditError);
        }
        
        return res.status(200).json({
          requiresTwoFactor: true,
          message: 'Código 2FA necessário',
        });
      }

      // Verificar token 2FA
      const isValidTwoFactor = await TwoFactorService.verifyLoginToken(
        user.id,
        twoFactorToken
      );

      if (!isValidTwoFactor) {
        // Registrar tentativa de login com 2FA inválido (não bloquear se falhar)
        try {
          await AuditService.log({
            userId: user.id,
            userEmail: user.email,
            action: 'login_2fa_failed',
            resourceType: 'auth',
            details: { reason: 'invalid_2fa_token' },
            ipAddress: req.ip || req.socket.remoteAddress || undefined,
            userAgent: req.get('user-agent') || undefined,
          });
        } catch (auditError) {
          console.warn('Failed to log audit (continuing):', auditError);
        }
        
        return res.status(401).json({ error: 'Código 2FA inválido' });
      }
    }

    // Registrar login bem-sucedido (não bloquear se falhar)
    try {
      await AuditService.log({
        userId: user.id,
        userEmail: user.email,
        action: 'login_success',
        resourceType: 'auth',
        ipAddress: req.ip || req.socket.remoteAddress || undefined,
        userAgent: req.get('user-agent') || undefined,
      });
    } catch (auditError) {
      console.warn('Failed to log audit (continuing):', auditError);
      // Não bloquear o login se o audit log falhar
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        cpf: user.cpf || undefined,
        birthDate: user.birthDate || undefined,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Log detalhado do erro em desenvolvimento
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
    }
    
    // Verificar se é erro de conexão com banco
    if (error.code === 'P1001' || error.message?.includes('connect') || error.message?.includes('Can\'t reach database')) {
      return res.status(500).json({ 
        error: 'Erro de conexão com o banco de dados',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({ 
      error: 'Erro ao fazer login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Forgot password - com rate limiting
router.post('/forgot-password', passwordResetRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists (security best practice)
    if (!user) {
      return res.json({ message: 'Se o email existir, você receberá um link para redefinir sua senha.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send reset email
    try {
      await EmailService.sendPasswordReset(user.email, user.name, resetToken);
    } catch (error) {
      console.error('Error sending reset email:', error);
      // Don't fail if email fails
    }

    res.json({ message: 'Se o email existir, você receberá um link para redefinir sua senha.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
});

// Reset password - com rate limiting
router.post('/reset-password', passwordResetRateLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token e senha são obrigatórios' });
    }

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        isTwoFactorEnabled: true,
        birthDate: true,
        cpf: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Update current user profile
router.put('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, birthDate, cpf } = req.body;

    // Validar CPF se fornecido
    if (cpf) {
      const cpfClean = cpf.replace(/\D/g, '');
      if (cpfClean.length !== 11) {
        return res.status(400).json({ error: 'CPF inválido. Deve conter 11 dígitos.' });
      }
    }

    // Preparar dados de atualização
    const updateData: any = {};
    if (name) updateData.name = name;
    if (birthDate) updateData.birthDate = new Date(birthDate);
    if (cpf !== undefined) {
      // Limpar CPF (remover pontos, traços e espaços)
      updateData.cpf = cpf ? cpf.replace(/\D/g, '') : null;
    }

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        isTwoFactorEnabled: true,
        birthDate: true,
        cpf: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Registrar ação
    await AuditService.log({
      userId: req.userId!,
      userEmail: req.user?.email,
      action: 'profile_updated',
      resourceType: 'user',
      resourceId: user.id.toString(),
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    });

    res.json({ user });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// Change password - Alterar senha (requer senha atual)
router.post('/change-password', authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      // Registrar tentativa de alteração de senha com senha incorreta
      try {
        await AuditService.log({
          userId: req.userId!,
          userEmail: req.user?.email,
          action: 'password_change_failed',
          resourceType: 'auth',
          details: { reason: 'invalid_current_password' },
          ipAddress: req.ip || req.socket.remoteAddress || undefined,
          userAgent: req.get('user-agent') || undefined,
        });
      } catch (auditError) {
        console.warn('Failed to log audit (continuing):', auditError);
      }

      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Hash nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await prisma.user.update({
      where: { id: req.userId! },
      data: {
        password: hashedPassword,
      },
    });

    // Registrar ação
    await AuditService.log({
      userId: req.userId!,
      userEmail: req.user?.email,
      action: 'password_changed',
      resourceType: 'auth',
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    });

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
});

// ============================================
// Rotas de 2FA (Autenticação de Dois Fatores)
// ============================================

// Setup 2FA - Iniciar configuração
router.post('/2fa/setup', authenticate, async (req: AuthRequest, res) => {
  try {
    const setupResult = await TwoFactorService.setupTwoFactor(req.userId!);

    // Registrar ação
    await AuditService.log({
      userId: req.userId!,
      userEmail: req.user?.email,
      action: '2fa_setup_initiated',
      resourceType: 'auth',
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    });

    res.json({
      secret: setupResult.secret,
      qrCodeUrl: setupResult.qrCodeUrl,
      backupCodes: setupResult.backupCodes,
    });
  } catch (error: any) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: error.message || 'Erro ao configurar 2FA' });
  }
});

// Verify and Enable 2FA - Verificar código e habilitar
router.post('/2fa/verify', authenticate, async (req: AuthRequest, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Código 2FA é obrigatório' });
    }

    const isValid = await TwoFactorService.verifyAndEnableTwoFactor(
      req.userId!,
      token
    );

    if (!isValid) {
      return res.status(400).json({ error: 'Código 2FA inválido' });
    }

    // Registrar ação
    await AuditService.log({
      userId: req.userId!,
      userEmail: req.user?.email,
      action: '2fa_enabled',
      resourceType: 'auth',
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    });

    res.json({ message: '2FA habilitado com sucesso' });
  } catch (error: any) {
    console.error('2FA verify error:', error);
    res.status(500).json({ error: error.message || 'Erro ao verificar 2FA' });
  }
});

// Disable 2FA - Desabilitar 2FA
router.post('/2fa/disable', authenticate, async (req: AuthRequest, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Senha é obrigatória para desabilitar 2FA' });
    }

    // Verificar senha
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    await TwoFactorService.disableTwoFactor(req.userId!);

    // Registrar ação
    await AuditService.log({
      userId: req.userId!,
      userEmail: req.user?.email,
      action: '2fa_disabled',
      resourceType: 'auth',
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    });

    res.json({ message: '2FA desabilitado com sucesso' });
  } catch (error: any) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: error.message || 'Erro ao desabilitar 2FA' });
  }
});

// Regenerate Backup Codes - Gerar novos códigos de backup
router.post('/2fa/backup-codes', authenticate, async (req: AuthRequest, res) => {
  try {
    const backupCodes = await TwoFactorService.regenerateBackupCodes(req.userId!);

    // Registrar ação
    await AuditService.log({
      userId: req.userId!,
      userEmail: req.user?.email,
      action: '2fa_backup_codes_regenerated',
      resourceType: 'auth',
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined,
    });

    res.json({ backupCodes });
  } catch (error: any) {
    console.error('2FA backup codes error:', error);
    res.status(500).json({ error: error.message || 'Erro ao gerar códigos de backup' });
  }
});

// Check 2FA Status - Verificar se 2FA está habilitado
router.get('/2fa/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const isEnabled = await TwoFactorService.isTwoFactorEnabled(req.userId!);
    res.json({ isTwoFactorEnabled: isEnabled });
  } catch (error: any) {
    console.error('2FA status error:', error);
    res.status(500).json({ error: 'Erro ao verificar status do 2FA' });
  }
});

export default router;


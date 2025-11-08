// Middleware de Autenticação Admin - Versão 2.0
// Proteção adicional para rotas admin

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'primeira-troca-secret-key-change-in-production';

export interface AdminRequest extends Request {
  adminUserId?: number;
  adminUser?: {
    id: number;
    email: string;
    isAdmin: boolean;
  };
}

/**
 * Middleware adicional de segurança para rotas admin
 * Verifica não apenas se é admin, mas também valida token e origem (opcional)
 */
export const requireAdminSecure = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Verificar token JWT
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // 2. Verificar e decodificar token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        userId: number;
        email: string;
        isAdmin: boolean;
      };
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    // 3. Verificar se usuário é admin
    if (!decoded.isAdmin) {
      return res.status(403).json({ 
        error: 'Acesso negado. Apenas administradores podem acessar esta rota.' 
      });
    }

    // 4. Verificar se usuário ainda existe e é admin no banco (segurança extra)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, isAdmin: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ 
        error: 'Acesso negado. Permissões de administrador revogadas.' 
      });
    }

    // 5. Validação de IP Whitelist (opcional - ativar via env)
    if (process.env.ADMIN_IP_WHITELIST === 'true') {
      const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];
      const clientIP = req.ip || req.socket.remoteAddress || '';
      
      if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
        console.warn(`⚠️ Tentativa de acesso admin de IP não autorizado: ${clientIP}`);
        // Em produção, você pode querer bloquear, mas em desenvolvimento permitir
        if (process.env.NODE_ENV === 'production') {
          return res.status(403).json({ 
            error: 'Acesso negado. IP não autorizado.' 
          });
        }
      }
    }

    // 6. Adicionar dados do admin à requisição
    req.adminUserId = user.id;
    req.adminUser = {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    next();
  } catch (error) {
    console.error('Error in requireAdminSecure:', error);
    return res.status(500).json({ error: 'Erro interno de autenticação' });
  }
};

/**
 * Middleware para registrar ações admin (auditoria)
 * Usado em conjunto com requireAdminSecure
 */
export const auditAdminAction = (
  action: string,
  resource: string
) => {
  return async (req: AdminRequest, res: Response, next: NextFunction) => {
    // Registrar ação no banco (quando tabela AuditLog for criada na v2.0)
    // Por enquanto, apenas log
    if (req.adminUser) {
      console.log(`📝 Admin Action: ${req.adminUser.email} - ${action} - ${resource}`);
      
      // TODO: Quando AuditLog estiver disponível, registrar:
      // await prisma.auditLog.create({
      //   data: {
      //     userId: req.adminUser.id,
      //     userEmail: req.adminUser.email,
      //     action,
      //     resource,
      //     resourceId: req.params.id ? parseInt(req.params.id) : undefined,
      //     ipAddress: req.ip,
      //     userAgent: req.get('user-agent'),
      //   },
      // });
    }
    
    next();
  };
};



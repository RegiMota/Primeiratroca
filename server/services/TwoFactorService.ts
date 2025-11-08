// TwoFactorService - Serviço para Autenticação de Dois Fatores (2FA)
// Versão 2.0 - Módulo 8: Segurança Avançada

import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TwoFactorSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export class TwoFactorService {
  /**
   * Gera um novo secret TOTP para o usuário
   */
  static generateSecret(email: string, serviceName: string = 'Primeira Troca'): speakeasy.GeneratedSecret {
    return speakeasy.generateSecret({
      name: `${serviceName} (${email})`,
      issuer: serviceName,
      length: 32,
    });
  }

  /**
   * Gera QR Code para o secret
   */
  static async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);
      return qrCodeUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Erro ao gerar QR code');
    }
  }

  /**
   * Configura 2FA para um usuário
   */
  static async setupTwoFactor(userId: number): Promise<TwoFactorSetupResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Gerar secret
    const secret = this.generateSecret(user.email);
    
    // Gerar códigos de backup (8 códigos)
    const backupCodes = this.generateBackupCodes(8);

    // Salvar secret e backup codes (mas não habilitar ainda)
    await prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: secret.base32,
        backupCodes: JSON.stringify(backupCodes),
        // Não habilitar ainda - usuário precisa verificar primeiro
      },
    });

    // Gerar QR Code
    const qrCodeUrl = await this.generateQRCode(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Verifica código TOTP
   */
  static verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Aceita tokens de ±2 períodos (60 segundos cada)
    });
  }

  /**
   * Verifica código TOTP e habilita 2FA se válido
   */
  static async verifyAndEnableTwoFactor(userId: number, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.totpSecret) {
      throw new Error('2FA não configurado para este usuário');
    }

    // Verificar token
    const isValid = this.verifyToken(user.totpSecret, token);

    if (isValid) {
      // Habilitar 2FA
      await prisma.user.update({
        where: { id: userId },
        data: {
          isTwoFactorEnabled: true,
        },
      });
      return true;
    }

    return false;
  }

  /**
   * Verifica código TOTP durante login
   */
  static async verifyLoginToken(userId: number, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isTwoFactorEnabled || !user.totpSecret) {
      return false;
    }

    // Verificar token TOTP
    const isValidTotp = this.verifyToken(user.totpSecret, token);
    
    if (isValidTotp) {
      return true;
    }

    // Se TOTP falhar, verificar códigos de backup
    if (user.backupCodes) {
      const backupCodes = JSON.parse(user.backupCodes) as string[];
      const codeIndex = backupCodes.indexOf(token);
      
      if (codeIndex !== -1) {
        // Remover código de backup usado
        backupCodes.splice(codeIndex, 1);
        
        await prisma.user.update({
          where: { id: userId },
          data: {
            backupCodes: JSON.stringify(backupCodes),
          },
        });
        
        return true;
      }
    }

    return false;
  }

  /**
   * Desabilita 2FA para um usuário
   */
  static async disableTwoFactor(userId: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: null,
        isTwoFactorEnabled: false,
        backupCodes: null,
      },
    });
  }

  /**
   * Gera novos códigos de backup
   */
  static generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Gerar código de 8 dígitos
      const code = Math.floor(10000000 + Math.random() * 90000000).toString();
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Regenera códigos de backup
   */
  static async regenerateBackupCodes(userId: number): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isTwoFactorEnabled) {
      throw new Error('2FA não está habilitado para este usuário');
    }

    const backupCodes = this.generateBackupCodes(8);

    await prisma.user.update({
      where: { id: userId },
      data: {
        backupCodes: JSON.stringify(backupCodes),
      },
    });

    return backupCodes;
  }

  /**
   * Verifica se usuário tem 2FA habilitado
   */
  static async isTwoFactorEnabled(userId: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isTwoFactorEnabled: true },
    });

    return user?.isTwoFactorEnabled || false;
  }
}


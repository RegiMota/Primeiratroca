// Middleware de Auditoria
// Versão 2.0 - Módulo 8: Segurança Avançada

import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/AuditService';
import { AuthRequest } from './auth';

/**
 * Middleware para registrar ações de auditoria
 * Deve ser usado após autenticação para ter acesso ao userId
 */
export const auditMiddleware = (
  action: string,
  resourceType: string,
  getResourceId?: (req: Request) => number | undefined,
  getDetails?: (req: Request) => any
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Registrar a ação após a resposta ser enviada
    const originalSend = res.send;
    res.send = function (body: any) {
      // Registrar após o envio da resposta
      setImmediate(async () => {
        try {
          const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || undefined;
          const userAgent = req.headers['user-agent'] || undefined;
          
          const resourceId = getResourceId ? getResourceId(req) : undefined;
          const details = getDetails ? getDetails(req) : undefined;

          await AuditService.log({
            userId: req.userId || undefined,
            userEmail: req.user?.email || undefined,
            action,
            resourceType,
            resourceId,
            details,
            ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
            userAgent,
          });
        } catch (error) {
          console.error('Error in audit middleware:', error);
          // Não falhar a resposta se o log falhar
        }
      });

      return originalSend.call(this, body);
    };

    next();
  };
};

/**
 * Middleware simples para registrar ações críticas
 */
export const auditAction = async (
  req: AuthRequest,
  action: string,
  resourceType: string,
  resourceId?: number,
  details?: any
) => {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || undefined;
    const userAgent = req.headers['user-agent'] || undefined;

    await AuditService.log({
      userId: req.userId || undefined,
      userEmail: req.user?.email || undefined,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Error logging audit action:', error);
    // Não falhar a operação principal se o log falhar
  }
};


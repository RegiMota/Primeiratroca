// AuditService - Serviço para registro de auditoria
// Versão 2.0 - Módulo 8: Segurança Avançada

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogData {
  userId?: number;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: number;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Registra uma ação de auditoria
   */
  static async log(data: AuditLogData) {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: data.userId || null,
          userEmail: data.userEmail || null,
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId || null,
          details: data.details ? JSON.stringify(data.details) : null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
        },
      });

      return auditLog;
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Não falhar a operação principal se o log falhar
      return null;
    }
  }

  /**
   * Busca logs de auditoria com filtros
   */
  static async getLogs(filters: {
    userId?: number;
    action?: string;
    resourceType?: string;
    resourceId?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    try {
      const where: any = {};

      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.action) {
        where.action = filters.action;
      }

      if (filters.resourceType) {
        where.resourceType = filters.resourceType;
      }

      if (filters.resourceId) {
        where.resourceId = filters.resourceId;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }

      const limit = filters.limit || 50;
      const offset = filters.offset || 0;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
          skip: offset,
        }),
        prisma.auditLog.count({ where }),
      ]);

      // Parse JSON details
      const formattedLogs = logs.map((log) => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
      }));

      return {
        logs: formattedLogs,
        total,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas de auditoria
   */
  static async getStats(startDate?: Date, endDate?: Date) {
    try {
      const where: any = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = startDate;
        }
        if (endDate) {
          where.createdAt.lte = endDate;
        }
      }

      const [
        totalLogs,
        logsByAction,
        logsByResourceType,
        topUsers,
      ] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.groupBy({
          by: ['action'],
          where,
          _count: {
            id: true,
          },
        }),
        prisma.auditLog.groupBy({
          by: ['resourceType'],
          where,
          _count: {
            id: true,
          },
        }),
        prisma.auditLog.groupBy({
          by: ['userId'],
          where,
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
          take: 10,
        }),
      ]);

      return {
        totalLogs,
        logsByAction: logsByAction.map((item) => ({
          action: item.action,
          count: item._count.id,
        })),
        logsByResourceType: logsByResourceType.map((item) => ({
          resourceType: item.resourceType,
          count: item._count.id,
        })),
        topUsers,
      };
    } catch (error) {
      console.error('Error getting audit stats:', error);
      throw error;
    }
  }
}


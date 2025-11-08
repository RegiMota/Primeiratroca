import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: number;
  user?: {
    id: number;
    email: string;
    isAdmin: boolean;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'primeira-troca-secret-key-change-in-production';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      isAdmin: boolean;
    };

    req.userId = decoded.userId;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      isAdmin: decoded.isAdmin,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};


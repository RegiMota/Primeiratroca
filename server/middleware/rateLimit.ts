// Rate Limiting Middleware
// Versão 2.0 - Módulo 8: Segurança Avançada

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate Limiter Global
 * Aplica limite de requisições para todas as rotas
 * Limite muito mais permissivo em desenvolvimento
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  // Aumentar drasticamente o limite em desenvolvimento para evitar 429 durante testes
  max: process.env.NODE_ENV === 'production' ? 500 : 5000, // Produção: 500, Desenvolvimento: 5000
  message: {
    error: 'Muitas requisições deste IP. Tente novamente em 15 minutos.',
  },
  standardHeaders: true, // Retorna informações de rate limit nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
  // Handler customizado para melhor formatação de erro
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Muitas requisições deste IP. Tente novamente em 15 minutos.',
      retryAfter: Math.ceil(15 * 60), // Segundos até poder tentar novamente
    });
  },
  // Desabilitar completamente em desenvolvimento se DISABLE_RATE_LIMIT=true
  skip: (req: Request) => {
    return process.env.NODE_ENV !== 'production' && process.env.DISABLE_RATE_LIMIT === 'true';
  },
});

/**
 * Rate Limiter para Rotas de Leitura Pública
 * Mais permissivo para GET requests em rotas públicas
 */
export const publicReadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 1000 : 2000, // Produção: 1000, Desenvolvimento: 2000
  message: {
    error: 'Muitas requisições deste IP. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Aplicar apenas a requisições GET
  skip: (req: Request) => req.method !== 'GET',
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Muitas requisições deste IP. Tente novamente em 15 minutos.',
      retryAfter: Math.ceil(15 * 60),
    });
  },
});

/**
 * Rate Limiter para Autenticação
 * Limite mais restritivo para login/registro
 * Muito mais permissivo em desenvolvimento
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  // Aumentar drasticamente o limite em desenvolvimento para evitar 429 durante testes
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // Produção: 5, Desenvolvimento: 100
  message: {
    error: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Não conta requisições bem-sucedidas
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
      retryAfter: Math.ceil(15 * 60),
    });
  },
  // Desabilitar completamente em desenvolvimento se DISABLE_RATE_LIMIT=true
  skip: (req: Request) => {
    return process.env.NODE_ENV !== 'production' && process.env.DISABLE_RATE_LIMIT === 'true';
  },
});

/**
 * Rate Limiter para API Admin
 * Limite mais restritivo para rotas administrativas
 * Muito mais permissivo em desenvolvimento para evitar 429 durante uso normal
 */
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  // Aumentar drasticamente o limite em desenvolvimento para evitar 429 durante uso normal do admin
  max: process.env.NODE_ENV === 'production' ? 200 : 2000, // Produção: 200, Desenvolvimento: 2000
  message: {
    error: 'Muitas requisições administrativas. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Muitas requisições administrativas. Tente novamente em 15 minutos.',
      retryAfter: Math.ceil(15 * 60),
    });
  },
  // Desabilitar completamente em desenvolvimento se DISABLE_RATE_LIMIT=true
  skip: (req: Request) => {
    return process.env.NODE_ENV !== 'production' && process.env.DISABLE_RATE_LIMIT === 'true';
  },
});

/**
 * Rate Limiter para Checkout
 * Proteção contra abuso durante checkout
 * Limite muito mais permissivo em desenvolvimento
 */
export const checkoutRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  // Aumentar drasticamente o limite em desenvolvimento para evitar 429 durante testes
  max: process.env.NODE_ENV === 'production' ? 10 : 100, // Produção: 10, Desenvolvimento: 100
  message: {
    error: 'Muitas tentativas de checkout. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Muitas tentativas de checkout. Tente novamente em 15 minutos.',
      retryAfter: Math.ceil(15 * 60),
    });
  },
  // Desabilitar completamente em desenvolvimento se DISABLE_RATE_LIMIT=true
  skip: (req: Request) => {
    return process.env.NODE_ENV !== 'production' && process.env.DISABLE_RATE_LIMIT === 'true';
  },
});

/**
 * Rate Limiter para Reset de Senha
 * Proteção contra spam de reset de senha
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Apenas 3 tentativas de reset de senha por IP a cada hora
  message: {
    error: 'Muitas tentativas de reset de senha. Tente novamente em 1 hora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Muitas tentativas de reset de senha. Tente novamente em 1 hora.',
      retryAfter: Math.ceil(60 * 60),
    });
  },
});


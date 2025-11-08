// reCAPTCHA Middleware
// Versão 2.0 - Módulo 8: Segurança Avançada

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '';
const RECAPTCHA_ENABLED = process.env.RECAPTCHA_ENABLED === 'true';

/**
 * Middleware para verificar reCAPTCHA
 * Usa reCAPTCHA v3 (score-based) ou v2 (checkbox)
 */
export const verifyRecaptcha = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Se reCAPTCHA não estiver habilitado, permitir requisição
  if (!RECAPTCHA_ENABLED || !RECAPTCHA_SECRET_KEY) {
    return next();
  }

  // Em desenvolvimento, se não houver token, apenas logar e permitir
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    const token = req.body.recaptchaToken || req.headers['x-recaptcha-token'];
    if (!token) {
      console.warn('[reCAPTCHA] Token não fornecido (permitindo em desenvolvimento)');
      return next();
    }
  }

  try {
    const token = req.body.recaptchaToken || req.headers['x-recaptcha-token'];

    if (!token) {
      // Em produção, bloquear se não houver token
      if (process.env.NODE_ENV === 'production') {
        return res.status(400).json({
          error: 'Token reCAPTCHA não fornecido',
        });
      }
      // Em desenvolvimento, permitir
      return next();
    }

    // Verificar token com Google
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: RECAPTCHA_SECRET_KEY,
          response: token,
          remoteip: req.ip || req.socket.remoteAddress,
        },
        timeout: 5000,
      }
    );

    const { success, score, action } = response.data;

    // Para reCAPTCHA v3, score deve ser >= 0.5 (configurável)
    const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5');

    if (!success) {
      console.warn('reCAPTCHA verification failed:', response.data);
      // Em desenvolvimento, permitir mesmo se falhar
      if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        console.warn('[reCAPTCHA] Verificação falhou (permitindo em desenvolvimento)');
        return next();
      }
      return res.status(400).json({
        error: 'Verificação reCAPTCHA falhou',
      });
    }

    // Se for reCAPTCHA v3, verificar score
    if (score !== undefined && score < minScore) {
      console.warn(`reCAPTCHA score too low: ${score} (min: ${minScore})`);
      // Em desenvolvimento, permitir mesmo se score for baixo
      if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        console.warn('[reCAPTCHA] Score baixo (permitindo em desenvolvimento)');
        return next();
      }
      return res.status(400).json({
        error: 'Atividade suspeita detectada',
      });
    }

    // Adicionar informações do reCAPTCHA à requisição
    (req as any).recaptcha = {
      success,
      score,
      action,
    };

    next();
  } catch (error: any) {
    console.error('Error verifying reCAPTCHA:', error);
    
    // Em caso de erro na verificação, permitir requisição em desenvolvimento
    // mas bloquear em produção
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        error: 'Erro ao verificar reCAPTCHA',
      });
    }

    // Em desenvolvimento, apenas logar o erro
    console.warn('reCAPTCHA verification error (allowing in dev):', error.message);
    next();
  }
};

/**
 * Middleware opcional para reCAPTCHA
 * Não bloqueia se falhar, apenas loga
 */
export const optionalRecaptcha = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!RECAPTCHA_ENABLED || !RECAPTCHA_SECRET_KEY) {
    return next();
  }

  try {
    const token = req.body.recaptchaToken || req.headers['x-recaptcha-token'];

    if (token) {
      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: RECAPTCHA_SECRET_KEY,
            response: token,
            remoteip: req.ip || req.socket.remoteAddress,
          },
        },
        {
          timeout: 5000,
        }
      );

      const { success, score } = response.data;
      const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5');

      if (success && (score === undefined || score >= minScore)) {
        (req as any).recaptcha = { success, score };
      } else {
        console.warn('reCAPTCHA verification failed (optional):', { success, score });
      }
    }
  } catch (error) {
    console.error('Error in optional reCAPTCHA verification:', error);
  }

  next();
};


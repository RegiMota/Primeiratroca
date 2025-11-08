// Centralized error handling utilities

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

export class ErrorHandler {
  static handle(error: any): AppError {
    // Network errors
    if (!error.response) {
      return {
        message: 'Erro de conexão. Verifique sua internet e tente novamente.',
        code: 'NETWORK_ERROR',
        statusCode: 0,
      };
    }

    const statusCode = error.response?.status;
    const errorData = error.response?.data;

    // Handle different status codes
    switch (statusCode) {
      case 400:
        return {
          message: errorData?.error || 'Dados inválidos. Verifique os campos e tente novamente.',
          code: 'BAD_REQUEST',
          statusCode: 400,
          details: errorData,
        };

      case 401:
        return {
          message: 'Sessão expirada. Por favor, faça login novamente.',
          code: 'UNAUTHORIZED',
          statusCode: 401,
        };

      case 403:
        return {
          message: 'Acesso negado. Você não tem permissão para realizar esta ação.',
          code: 'FORBIDDEN',
          statusCode: 403,
        };

      case 404:
        return {
          message: errorData?.error || 'Recurso não encontrado.',
          code: 'NOT_FOUND',
          statusCode: 404,
        };

      case 409:
        return {
          message: errorData?.error || 'Conflito. O recurso já existe.',
          code: 'CONFLICT',
          statusCode: 409,
        };

      case 422:
        return {
          message: errorData?.error || 'Dados inválidos. Verifique os campos.',
          code: 'VALIDATION_ERROR',
          statusCode: 422,
          details: errorData?.errors,
        };

      case 429:
        return {
          message: 'Muitas requisições. Aguarde um momento e tente novamente.',
          code: 'RATE_LIMIT',
          statusCode: 429,
        };

      case 500:
        return {
          message: 'Erro interno do servidor. Tente novamente mais tarde.',
          code: 'SERVER_ERROR',
          statusCode: 500,
        };

      case 503:
        return {
          message: 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
          code: 'SERVICE_UNAVAILABLE',
          statusCode: 503,
        };

      default:
        return {
          message:
            errorData?.error ||
            error.message ||
            'Ocorreu um erro inesperado. Tente novamente.',
          code: 'UNKNOWN_ERROR',
          statusCode: statusCode || 500,
          details: errorData,
        };
    }
  }

  static getErrorMessage(error: any): string {
    const appError = this.handle(error);
    return appError.message;
  }

  static isNetworkError(error: any): boolean {
    return !error.response || error.code === 'NETWORK_ERROR';
  }

  static isAuthError(error: any): boolean {
    const statusCode = error.response?.status;
    return statusCode === 401 || statusCode === 403;
  }

  static isValidationError(error: any): boolean {
    const statusCode = error.response?.status;
    return statusCode === 400 || statusCode === 422;
  }

  static isNotFoundError(error: any): boolean {
    const statusCode = error.response?.status;
    return statusCode === 404;
  }
}

// Common error messages in Portuguese
export const ErrorMessages = {
  NETWORK: 'Erro de conexão. Verifique sua internet e tente novamente.',
  UNAUTHORIZED: 'Sessão expirada. Por favor, faça login novamente.',
  FORBIDDEN: 'Acesso negado. Você não tem permissão para realizar esta ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente mais tarde.',
  UNKNOWN: 'Ocorreu um erro inesperado. Tente novamente.',
  VALIDATION: 'Dados inválidos. Verifique os campos e tente novamente.',
  RATE_LIMIT: 'Muitas requisições. Aguarde um momento e tente novamente.',
};


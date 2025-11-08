// Validation utilities

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validators = {
  required: (value: string | undefined | null): ValidationResult => {
    if (!value || value.trim() === '') {
      return { isValid: false, error: 'Este campo é obrigatório' };
    }
    return { isValid: true };
  },

  email: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: false, error: 'Email é obrigatório' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { isValid: false, error: 'Email inválido' };
    }
    return { isValid: true };
  },

  password: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: false, error: 'Senha é obrigatória' };
    }
    if (value.length < 6) {
      return { isValid: false, error: 'Senha deve ter pelo menos 6 caracteres' };
    }
    return { isValid: true };
  },

  passwordMatch: (password: string, confirmPassword: string): ValidationResult => {
    if (password !== confirmPassword) {
      return { isValid: false, error: 'As senhas não coincidem' };
    }
    return { isValid: true };
  },

  minLength: (value: string, min: number, fieldName: string = 'Campo'): ValidationResult => {
    if (value.length < min) {
      return {
        isValid: false,
        error: `${fieldName} deve ter pelo menos ${min} caracteres`,
      };
    }
    return { isValid: true };
  },

  maxLength: (value: string, max: number, fieldName: string = 'Campo'): ValidationResult => {
    if (value.length > max) {
      return {
        isValid: false,
        error: `${fieldName} deve ter no máximo ${max} caracteres`,
      };
    }
    return { isValid: true };
  },

  phone: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: true }; // Optional field
    }
    const phoneRegex = /^[\d\s\(\)\-]+$/;
    if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
      return { isValid: false, error: 'Telefone inválido' };
    }
    return { isValid: true };
  },

  zipCode: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: true }; // Optional field
    }
    const zipCodeRegex = /^\d{5}-?\d{3}$/;
    if (!zipCodeRegex.test(value)) {
      return { isValid: false, error: 'CEP inválido (formato: 12345-678)' };
    }
    return { isValid: true };
  },

  cardNumber: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: false, error: 'Número do cartão é obrigatório' };
    }
    const cardNumber = value.replace(/\s/g, '');
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      return { isValid: false, error: 'Número do cartão inválido' };
    }
    if (!/^\d+$/.test(cardNumber)) {
      return { isValid: false, error: 'Número do cartão deve conter apenas dígitos' };
    }
    return { isValid: true };
  },

  cardExpiry: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: false, error: 'Data de expiração é obrigatória' };
    }
    const expiryRegex = /^\d{2}\/\d{2}$/;
    if (!expiryRegex.test(value)) {
      return { isValid: false, error: 'Formato inválido (use MM/AA)' };
    }
    const [month, year] = value.split('/');
    const monthNum = parseInt(month, 10);
    const yearNum = 2000 + parseInt(year, 10);
    const currentDate = new Date();
    const expiryDate = new Date(yearNum, monthNum - 1);

    if (monthNum < 1 || monthNum > 12) {
      return { isValid: false, error: 'Mês inválido' };
    }
    if (expiryDate < currentDate) {
      return { isValid: false, error: 'Cartão expirado' };
    }
    return { isValid: true };
  },

  cardCvc: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: false, error: 'CVC é obrigatório' };
    }
    if (value.length < 3 || value.length > 4) {
      return { isValid: false, error: 'CVC deve ter 3 ou 4 dígitos' };
    }
    if (!/^\d+$/.test(value)) {
      return { isValid: false, error: 'CVC deve conter apenas dígitos' };
    }
    return { isValid: true };
  },

  positiveNumber: (value: string | number, fieldName: string = 'Campo'): ValidationResult => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue <= 0) {
      return { isValid: false, error: `${fieldName} deve ser um número positivo` };
    }
    return { isValid: true };
  },

  url: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: true }; // Optional
    }
    try {
      new URL(value);
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'URL inválida' };
    }
  },

  jsonArray: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: true }; // Optional
    }
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        return { isValid: false, error: 'Deve ser um array JSON válido' };
      }
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'JSON inválido' };
    }
  },
};

export const validateForm = <T extends Record<string, any>>(
  formData: T,
  rules: Partial<Record<keyof T, Array<(value: any) => ValidationResult>>>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach((field) => {
    const fieldRules = rules[field as keyof T];
    if (fieldRules) {
      for (const validator of fieldRules) {
        const result = validator(formData[field as keyof T]);
        if (!result.isValid && result.error) {
          errors[field] = result.error;
          break; // Stop at first error
        }
      }
    }
  });

  return errors;
};


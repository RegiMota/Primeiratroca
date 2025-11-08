// Validation utilities para Admin Panel
// Versão simplificada do sistema principal

export const validators = {
  required: (value: any) => {
    if (value === null || value === undefined || value === '') {
      return 'Este campo é obrigatório';
    }
    return null;
  },

  email: (value: string) => {
    if (!value) return null; // Se vazio, required vai tratar
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Email inválido';
    }
    return null;
  },

  minLength: (min: number) => (value: string) => {
    if (!value) return null;
    if (value.length < min) {
      return `Mínimo de ${min} caracteres`;
    }
    return null;
  },
};

export function validateForm(
  data: Record<string, any>,
  rules: Record<string, Array<(value: any) => string | null>>
): Record<string, string> {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach((field) => {
    const value = data[field];
    const fieldRules = rules[field];

    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break; // Para na primeira validação que falhar
      }
    }
  });

  return errors;
}



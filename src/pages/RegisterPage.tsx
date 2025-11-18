import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { validators, validateForm } from '../lib/validation';

export function RegisterPage() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    cpf: '',
    email: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm(formData, {
      firstName: [validators.required, (v) => validators.minLength(v, 2, 'Nome')],
      lastName: [validators.required, (v) => validators.minLength(v, 2, 'Sobrenome')],
      cpf: [validators.cpf],
      email: [validators.email],
      birthDate: [validators.birthDate],
      password: [validators.password],
      confirmPassword: [
        validators.required,
        (v) => validators.passwordMatch(formData.password, v),
      ],
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0];
      toast.error('Erro de validação', {
        description: firstError,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Combinar nome e sobrenome
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      
      await register(
        fullName,
        formData.email,
        formData.password,
        formData.cpf.replace(/\D/g, ''), // Remove formatação do CPF
        formData.birthDate
      );
      toast.success('Conta criada!', {
        description: 'Bem-vindo à Primeira Troca. Comece a comprar agora!',
      });
      setLocation('/');
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro ao criar conta. Tente novamente.';
      toast.error('Erro ao criar conta', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <div className="rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-sky-500" style={{ fontSize: '2rem', fontWeight: 900 }}>
            Criar Conta
          </h1>
          <p className="text-gray-600">
            Cadastre-se para começar a comprar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className={`mt-2 ${errors.firstName ? 'border-red-500' : ''}`}
                placeholder="João"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className={`mt-2 ${errors.lastName ? 'border-red-500' : ''}`}
                placeholder="Silva"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={(e) => {
                // Formatar CPF automaticamente
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                  if (value.length > 3) {
                    value = value.replace(/^(\d{3})(\d)/, '$1.$2');
                  }
                  if (value.length > 6) {
                    value = value.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
                  }
                  if (value.length > 9) {
                    value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
                  }
                  setFormData({ ...formData, cpf: value });
                  if (errors.cpf) {
                    setErrors({ ...errors, cpf: '' });
                  }
                }
              }}
              required
              className={`mt-2 ${errors.cpf ? 'border-red-500' : ''}`}
              placeholder="000.000.000-00"
              maxLength={14}
            />
            {errors.cpf && (
              <p className="mt-1 text-sm text-red-500">{errors.cpf}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className={`mt-2 ${errors.email ? 'border-red-500' : ''}`}
              placeholder="seu@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="birthDate">Data de Aniversário</Label>
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={handleInputChange}
              required
              className={`mt-2 ${errors.birthDate ? 'border-red-500' : ''}`}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.birthDate && (
              <p className="mt-1 text-sm text-red-500">{errors.birthDate}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className={`mt-2 ${errors.password ? 'border-red-500' : ''}`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Mínimo de 6 caracteres</p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className={`mt-2 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 py-6 text-white shadow-lg hover:from-amber-500 hover:to-orange-600 disabled:opacity-50"
            style={{ fontWeight: 700, fontSize: '1.1rem' }}
          >
            {isLoading ? 'Criando conta...' : 'Criar Conta'}
          </Button>

          <div className="text-center">
            <p className="text-gray-600">
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => setLocation('/login')}
                className="text-sky-500 hover:underline"
                style={{ fontWeight: 600 }}
              >
                Entrar
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { validators, validateForm } from '../lib/validation';

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
      email: [validators.email],
      password: [validators.required],
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
      await login(formData.email, formData.password);
      toast.success('Bem-vindo de volta!', {
        description: 'Login realizado com sucesso.',
      });
      setLocation('/');
    } catch (error) {
      toast.error('Erro ao fazer login', {
        description: 'Verifique suas credenciais e tente novamente.',
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
            Bem-vindo de Volta
          </h1>
          <p className="text-gray-600">
            Faça login para acessar sua conta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 py-6 text-white shadow-lg hover:from-amber-500 hover:to-orange-600 disabled:opacity-50"
            style={{ fontWeight: 700, fontSize: '1.1rem' }}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setLocation('/forgot-password')}
              className="text-sm text-sky-500 hover:underline"
              style={{ fontWeight: 600 }}
            >
              Esqueceu sua senha?
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-600">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => setLocation('/register')}
                className="text-sky-500 hover:underline"
                style={{ fontWeight: 600 }}
              >
                Criar Conta
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

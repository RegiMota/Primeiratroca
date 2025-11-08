import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authAPI } from '../lib/api';
import { toast } from 'sonner';

export function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [match] = useRoute('/reset-password');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from URL query params
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    
    if (!tokenParam) {
      toast.error('Token inválido');
      setLocation('/login');
      return;
    }

    setToken(tokenParam);
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!token) {
      toast.error('Token inválido');
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.resetPassword(token, password);
      setIsSuccess(true);
      toast.success('Senha redefinida com sucesso!');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error('Erro ao redefinir senha', {
        description: error.response?.data?.error || 'Token inválido ou expirado. Tente solicitar um novo link.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-md px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-4 text-2xl font-bold text-sky-500">Senha Redefinida!</h1>
            <p className="mb-8 text-gray-600">
              Sua senha foi redefinida com sucesso. Agora você pode fazer login com sua nova senha.
            </p>
            <Button
              onClick={() => setLocation('/login')}
              className="w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
              style={{ fontWeight: 700 }}
            >
              Ir para Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <Button
          onClick={() => setLocation('/login')}
          variant="ghost"
          className="mb-6 text-sky-500 hover:bg-sky-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Login
        </Button>

        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
            <Lock className="h-8 w-8 text-sky-500" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-sky-500">Redefinir Senha</h1>
          <p className="text-gray-600">
            Digite sua nova senha abaixo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">Nova Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Digite a senha novamente"
              className="mt-2"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
            style={{ fontWeight: 700 }}
            disabled={isLoading}
          >
            {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
          </Button>
        </form>
      </div>
    </div>
  );
}


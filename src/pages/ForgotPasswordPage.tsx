import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, ArrowLeft } from 'lucide-react';
import { authAPI } from '../lib/api';
import { toast } from 'sonner';

export function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authAPI.forgotPassword(email);
      setEmailSent(true);
      toast.success('Email enviado com sucesso!');
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast.error('Erro ao enviar email', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="mx-auto max-w-md px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-4 text-2xl font-bold text-sky-500">Email Enviado!</h1>
            <p className="mb-6 text-gray-600">
              Se o email <strong>{email}</strong> existir em nosso sistema, você receberá um link para redefinir sua senha.
            </p>
            <p className="mb-8 text-sm text-gray-500">
              Verifique sua caixa de entrada e a pasta de spam. O link expira em 1 hora.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setLocation('/login')}
                className="w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
                style={{ fontWeight: 700 }}
              >
                Voltar ao Login
              </Button>
              <Button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                variant="outline"
                className="w-full rounded-full border-2 border-sky-500 text-sky-500 hover:bg-sky-50"
                style={{ fontWeight: 700 }}
              >
                Enviar Novamente
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
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
            <Mail className="h-8 w-8 text-sky-500" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-sky-500">Recuperar Senha</h1>
          <p className="text-gray-600">
            Digite seu email e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="mt-2"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
            style={{ fontWeight: 700 }}
            disabled={isLoading}
          >
            {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
          </Button>
        </form>
      </div>
    </div>
  );
}


import { Mail } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';

export function Newsletter() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success('Inscrito!', {
        description: 'Obrigado por se inscrever em nossa newsletter!',
      });
      setEmail('');
    }
  };

  return (
    <section className="bg-gradient-to-r from-sky-500 to-blue-600 py-16">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Mail className="mx-auto mb-4 h-12 w-12 text-white" />
        <h2 className="mb-3 text-white" style={{ fontSize: '2rem', fontWeight: 900 }}>
          Assine Nossa Newsletter
        </h2>
        <p className="mb-8 text-blue-100" style={{ fontSize: '1.125rem' }}>
          Receba as últimas novidades sobre novos produtos e ofertas exclusivas!
        </p>

        <form onSubmit={handleSubmit} className="mx-auto flex max-w-md gap-2">
          <Input
            type="email"
            placeholder="Digite seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 rounded-full border-0 bg-white px-6 py-6"
          />
          <Button
            type="submit"
            size="lg"
            className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-8 text-white hover:from-amber-500 hover:to-orange-600"
            style={{ fontWeight: 700 }}
          >
            Inscrever
          </Button>
        </form>
      </div>
    </section>
  );
}

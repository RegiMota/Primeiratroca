import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { XCircle, ArrowLeft } from 'lucide-react';

export function CheckoutFailurePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-center">
      <div className="rounded-2xl bg-white p-8 shadow-md">
        <XCircle className="mx-auto h-16 w-16 text-red-500" />
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Pagamento Não Processado</h1>
        <p className="mt-2 text-lg text-gray-600">
          Não foi possível processar seu pagamento.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Por favor, verifique os dados do seu cartão ou tente novamente com outro método de pagamento.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button
            onClick={() => setLocation('/checkout')}
            className="bg-sky-500 hover:bg-sky-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
          <Button
            onClick={() => setLocation('/cart')}
            variant="outline"
          >
            Voltar ao Carrinho
          </Button>
        </div>
      </div>
    </div>
  );
}


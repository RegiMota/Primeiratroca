import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '../components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { paymentsAPI, ordersAPI } from '../lib/api';
import { toast } from 'sonner';

export function CheckoutSuccessPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  useEffect(() => {
    // Buscar payment_id da URL
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIdParam = urlParams.get('payment_id');
    const preferenceId = urlParams.get('preference_id');

    if (paymentIdParam) {
      setPaymentId(paymentIdParam);
      // Verificar status do pagamento
      verifyPayment(paymentIdParam);
    } else if (preferenceId) {
      // Se tiver preference_id, buscar o payment_id
      verifyPreference(preferenceId);
    } else {
      setIsLoading(false);
      toast.error('Parâmetros de pagamento não encontrados');
    }
  }, []);

  const verifyPreference = async (preferenceId: string) => {
    try {
      // Buscar pagamento pelo preference_id (gatewayPaymentId)
      const payments = await paymentsAPI.getAll();
      const payment = payments.find((p: any) => p.gatewayPaymentId === preferenceId);
      
      if (payment && payment.gatewayPaymentId) {
        verifyPayment(payment.gatewayPaymentId);
      } else {
        setIsLoading(false);
        toast.error('Pagamento não encontrado');
      }
    } catch (error) {
      console.error('Error verifying preference:', error);
      setIsLoading(false);
    }
  };

  const verifyPayment = async (mpPaymentId: string) => {
    try {
      // Buscar pagamento no nosso sistema
      const payments = await paymentsAPI.getAll();
      const payment = payments.find((p: any) => p.gatewayPaymentId === mpPaymentId);
      
      if (payment) {
        // Verificar status do pagamento
        if (payment.status === 'approved') {
          setIsLoading(false);
          toast.success('Pagamento aprovado!');
        } else if (payment.status === 'pending' || payment.status === 'processing') {
          setIsLoading(false);
          toast.info('Pagamento em processamento');
        } else {
          setIsLoading(false);
          toast.warning('Status do pagamento: ' + payment.status);
        }
      } else {
        setIsLoading(false);
        toast.warning('Pagamento ainda não processado. Aguarde alguns instantes.');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-sky-500" />
        <h2 className="mt-4 text-2xl font-bold">Verificando pagamento...</h2>
        <p className="mt-2 text-gray-600">Aguarde enquanto verificamos o status do seu pagamento.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-center">
      <div className="rounded-2xl bg-white p-8 shadow-md">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Pagamento Recebido!</h1>
        <p className="mt-2 text-lg text-gray-600">
          Seu pagamento foi processado com sucesso.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Você receberá um email de confirmação em breve com os detalhes do seu pedido.
        </p>
        
        {paymentId && (
          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              <strong>ID do Pagamento:</strong> {paymentId}
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button
            onClick={() => setLocation('/orders')}
            className="bg-sky-500 hover:bg-sky-600"
          >
            Ver Meus Pedidos
          </Button>
          <Button
            onClick={() => setLocation('/shop')}
            variant="outline"
          >
            Continuar Comprando
          </Button>
        </div>
      </div>
    </div>
  );
}


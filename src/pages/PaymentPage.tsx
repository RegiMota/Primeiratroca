import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { paymentsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { QrCode, Copy, CheckCircle2, XCircle, Loader2, ArrowLeft, Clock } from 'lucide-react';

export function PaymentPage() {
  const [, params] = useRoute('/payment/:paymentId');
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const paymentId = params?.paymentId ? parseInt(params.paymentId, 10) : null;
  
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [pixExpiresAt, setPixExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired'>('pending');
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [amount, setAmount] = useState<number | null>(null);

  // Carregar dados do pagamento
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      toast.error('Você precisa estar logado para acessar esta página');
      setLocation('/login');
      return;
    }

    if (!paymentId || isNaN(paymentId)) {
      toast.error('ID de pagamento inválido');
      setLocation('/checkout');
      return;
    }

    const loadPayment = async () => {
      try {
        setLoading(true);
        console.log('📦 Carregando pagamento ID:', paymentId);
        
        const paymentData = await paymentsAPI.getById(paymentId);
        console.log('📦 Dados do pagamento recebidos:', {
          id: paymentData.id,
          method: paymentData.paymentMethod,
          status: paymentData.status,
          hasQrCode: !!paymentData.qrCodeBase64,
          hasPixCode: !!paymentData.pixCode,
          expiresAt: paymentData.pixExpiresAt,
        });

        // Verificar se é um pagamento PIX
        if (paymentData.paymentMethod !== 'pix') {
          toast.error('Este não é um pagamento PIX');
          setLocation('/checkout');
          return;
        }

        // Verificar status
        setPaymentStatus(paymentData.status);
        setOrderId(paymentData.orderId);
        // Converter amount para número (pode vir como string ou Decimal do Prisma)
        setAmount(typeof paymentData.amount === 'number' ? paymentData.amount : Number(paymentData.amount));

        // Se já foi aprovado, redirecionar
        if (paymentData.status === 'approved') {
          toast.success('Pagamento já foi aprovado!');
          setTimeout(() => {
            setLocation('/checkout/success');
          }, 2000);
          return;
        }

        // Se foi rejeitado ou cancelado
        if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
          toast.error('Pagamento foi rejeitado ou cancelado');
          setLocation('/checkout/failure');
          return;
        }

        // Verificar e definir data de expiração
        let expirationDate: Date;
        if (paymentData.pixExpiresAt) {
          expirationDate = new Date(paymentData.pixExpiresAt);
          const now = new Date();
          console.log('📅 Data de expiração do backend:', {
            pixExpiresAt: paymentData.pixExpiresAt,
            expirationDate: expirationDate.toISOString(),
            now: now.toISOString(),
            diffMinutes: (expirationDate.getTime() - now.getTime()) / 60000,
          });
          
          // Verificar se a data está muito no futuro (mais de 1 hora = provavelmente incorreta)
          const diffHours = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          if (diffHours > 1) {
            console.warn('⚠️ Data de expiração parece incorreta (mais de 1 hora), usando fallback de 5 minutos');
            expirationDate = new Date();
            expirationDate.setMinutes(expirationDate.getMinutes() + 5);
          } else if (now > expirationDate) {
            setPaymentStatus('expired');
            toast.error('QR Code PIX expirado');
            return;
          }
        } else {
          // Fallback: 5 minutos a partir de agora se não houver data de expiração
          expirationDate = new Date();
          expirationDate.setMinutes(expirationDate.getMinutes() + 5);
          console.log('⚠️ pixExpiresAt não encontrado, usando fallback de 5 minutos:', expirationDate.toISOString());
        }
        setPixExpiresAt(expirationDate);
        console.log('✅ Data de expiração definida:', expirationDate.toISOString());

        // Carregar QR code
        if (paymentData.qrCodeBase64 || paymentData.pixCode) {
          let qrCodeImage = paymentData.qrCodeBase64 || null;
          if (qrCodeImage && !qrCodeImage.startsWith('data:')) {
            qrCodeImage = `data:image/png;base64,${qrCodeImage}`;
          }
          setPixQrCode(qrCodeImage);
          setPixCode(paymentData.pixCode || null);
          
          // Salvar no localStorage para recuperar depois
          localStorage.setItem('pixPaymentId', paymentId.toString());
        } else {
          toast.error('QR Code não encontrado');
        }
      } catch (error: any) {
        console.error('❌ Erro ao carregar pagamento:', error);
        toast.error('Erro ao carregar dados do pagamento');
        setLocation('/checkout');
      } finally {
        setLoading(false);
      }
    };

    loadPayment();
  }, [paymentId, isAuthenticated, authLoading, setLocation]);

  // Atualizar contador de tempo
  useEffect(() => {
    if (!pixExpiresAt || paymentStatus !== 'pending') {
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = pixExpiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setPaymentStatus('expired');
        setTimeRemaining('Expirado');
        toast.error('QR Code PIX expirado. O pagamento foi cancelado.');
        localStorage.removeItem('pixPaymentId');
        // Não redirecionar imediatamente, deixar o usuário ver a mensagem
        return;
      }

      const totalMinutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      // Limitar exibição a no máximo 5 minutos (caso a data esteja incorreta)
      if (totalMinutes > 5) {
        console.warn('⚠️ Tempo restante maior que 5 minutos, limitando exibição');
        setTimeRemaining('5 min 0 seg');
      } else if (totalMinutes > 0) {
        setTimeRemaining(`${totalMinutes} min ${seconds} seg`);
      } else if (seconds > 0) {
        setTimeRemaining(`${seconds} seg`);
      } else {
        setTimeRemaining('Expirado');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [pixExpiresAt, paymentStatus]);

  // Verificar status do pagamento automaticamente
  useEffect(() => {
    if (!paymentId || paymentStatus !== 'pending' || authLoading) {
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        setCheckingStatus(true);
        const paymentData = await paymentsAPI.getById(paymentId);
        
        if (paymentData.status === 'approved') {
          setPaymentStatus('approved');
          localStorage.removeItem('pixPaymentId');
          toast.success('Pagamento PIX confirmado!');
          setTimeout(() => {
            setLocation('/checkout/success');
          }, 2000);
        } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
          setPaymentStatus(paymentData.status);
          localStorage.removeItem('pixPaymentId');
          toast.error('Pagamento PIX não foi aprovado');
          setTimeout(() => {
            setLocation('/checkout/failure');
          }, 2000);
        }
      } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    // Verificar imediatamente
    checkPaymentStatus();

    // Verificar a cada 5 segundos
    const checkInterval = setInterval(checkPaymentStatus, 5000);

    // Parar após 5 minutos (tempo máximo de expiração do PIX)
    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      setCheckingStatus(false);
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [paymentId, paymentStatus, authLoading, setLocation]);

  const handleCopyPixCode = async () => {
    if (!pixCode) {
      toast.error('Código PIX não disponível');
      return;
    }

    try {
      await navigator.clipboard.writeText(pixCode);
      toast.success('Código PIX copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar código PIX:', error);
      toast.error('Erro ao copiar código PIX');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando dados do pagamento...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'expired') {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <CardTitle>QR Code Expirado</CardTitle>
            </div>
            <CardDescription>
              O QR Code PIX expirou. Por favor, inicie uma nova compra.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/shop')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para a Loja
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'approved') {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <CardTitle>Pagamento Aprovado!</CardTitle>
            </div>
            <CardDescription>
              Seu pagamento foi confirmado com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 mb-4">
              Redirecionando para a página de sucesso...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/checkout')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Checkout
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pagamento PIX
          </h1>
          <p className="text-gray-600">
            Complete o pagamento escaneando o QR Code ou copiando o código PIX
          </p>
        </div>

        {/* Card Principal */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>ID do Pagamento: #{paymentId}</CardTitle>
                {orderId && (
                  <CardDescription className="mt-1">
                    Pedido #{orderId}
                  </CardDescription>
                )}
              </div>
              {checkingStatus && (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Informações do Pagamento */}
            {amount && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Valor a pagar:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    R$ {Number(amount).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            )}

            {/* Timer */}
            {pixExpiresAt && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Tempo restante:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {timeRemaining || 'Calculando...'}
                  </span>
                </div>
              </div>
            )}

            {/* QR Code */}
            {pixQrCode ? (
              <div className="mb-6">
                <div className="bg-white p-6 rounded-lg border-2 border-gray-200 flex justify-center">
                  <img
                    src={pixQrCode}
                    alt="QR Code PIX"
                    className="max-w-full h-auto"
                    style={{ maxWidth: '300px' }}
                  />
                </div>
                <p className="text-center text-sm text-gray-600 mt-4">
                  Escaneie o QR Code com o aplicativo do seu banco
                </p>
              </div>
            ) : (
              <div className="mb-6 p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                <QrCode className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-600 text-center">
                  QR Code não disponível
                </p>
              </div>
            )}

            {/* Código PIX */}
            {pixCode && (
              <div className="mb-6">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Código PIX (Copiar e Colar)
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={pixCode}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopyPixCode}
                    variant="outline"
                    className="flex-shrink-0"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Copie o código acima e cole no aplicativo do seu banco
                </p>
              </div>
            )}

            {/* Status */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    Aguardando pagamento
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    O pagamento será confirmado automaticamente em até alguns minutos após a transferência.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Como pagar com PIX</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Abra o aplicativo do seu banco</li>
              <li>Escaneie o QR Code ou cole o código PIX</li>
              <li>Confirme o pagamento no valor exibido</li>
              <li>Aguarde a confirmação automática (pode levar alguns minutos)</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


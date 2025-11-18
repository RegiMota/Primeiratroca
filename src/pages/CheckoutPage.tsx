import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ordersAPI, paymentsAPI, shippingAPI, addressesAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { CouponInput } from '../components/CouponInput';
import { PaymentMethodSelector, PaymentMethod } from '../components/PaymentMethodSelector';
import { toast } from 'sonner';
import { MapPin, Plus, Check, Search, QrCode, Copy, Loader2 } from 'lucide-react';
import { AnalyticsEvents } from '../lib/analytics';
import { UserAddress, ShippingOption, ApiError, CardError, AppliedCoupon, PaymentData } from '../types';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// Type guard para verificar se é um erro da API
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('message' in error || 'response' in error)
  );
}

// Helper para extrair mensagem de erro
function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Erro desconhecido';
}

export function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [installments, setInstallments] = useState<number | null>(null);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [pixExpiresAt, setPixExpiresAt] = useState<Date | null>(null);
  const [pixPaymentId, setPixPaymentId] = useState<number | null>(null);
  const [checkingPixStatus, setCheckingPixStatus] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Estados para endereços e frete (v2.0)
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [isNewAddress, setIsNewAddress] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);

  // Opção de retirada na loja (sempre disponível)
  const storePickupOption: ShippingOption = {
    service: 'STORE_PICKUP',
    name: 'Retirar na Loja - Grátis',
    price: 0,
    estimatedDays: 0,
    carrier: 'loja',
  };

  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardHolderName: '', // Nome do portador do cartão
    cardHolderCpf: '', // CPF do portador do cartão
  });

  // Carregar endereços do usuário (v2.0)
  useEffect(() => {
    // Esperar o AuthContext terminar de carregar antes de verificar autenticação
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      setLocation('/login');
      return;
    }

    // Não redirecionar se houver um pagamento PIX pendente
    const savedPixPaymentId = localStorage.getItem('pixPaymentId');
    if (items.length === 0 && !savedPixPaymentId) {
      setLocation('/cart');
      return;
    }

    // Carregar endereços salvos
    const loadAddresses = async () => {
      try {
        const response = await addressesAPI.getAll();
        setUserAddresses(response.addresses || []);
        
        // Selecionar endereço padrão se existir
        const defaultAddress = response.addresses?.find((addr: UserAddress) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setIsNewAddress(false);
          // Preencher formulário com endereço padrão
          setFormData(prev => ({
            ...prev,
            fullName: defaultAddress.recipientName || user?.name || '',
            phone: defaultAddress.phone || '',
            address: `${defaultAddress.street}, ${defaultAddress.number}${defaultAddress.complement ? ` - ${defaultAddress.complement}` : ''}`,
            city: defaultAddress.city,
            state: defaultAddress.state,
            zipCode: defaultAddress.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2'),
          }));
          // Calcular frete automaticamente
          calculateShipping(defaultAddress.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2'));
        } else if (response.addresses?.length > 0) {
          // Se não houver padrão, selecionar o primeiro endereço
          const firstAddress = response.addresses[0];
          setSelectedAddressId(firstAddress.id);
          setIsNewAddress(false);
          // Preencher formulário com primeiro endereço
          setFormData(prev => ({
            ...prev,
            fullName: firstAddress.recipientName || user?.name || '',
            phone: firstAddress.phone || '',
            address: `${firstAddress.street}, ${firstAddress.number}${firstAddress.complement ? ` - ${firstAddress.complement}` : ''}`,
            city: firstAddress.city,
            state: firstAddress.state,
            zipCode: firstAddress.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2'),
          }));
          // Calcular frete automaticamente
          calculateShipping(firstAddress.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2'));
        } else {
          setIsNewAddress(true);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
      }
    };

    loadAddresses();
    
    // Rastrear início do checkout
    if (items.length > 0) {
      const checkoutItems = items.map((item) => ({
        productId: item.product.id.toString(),
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      }));
      
      AnalyticsEvents.beginCheckout(totalPrice, checkoutItems);
    }
  }, [isAuthenticated, authLoading, items.length, setLocation, items, totalPrice]);

  // Recuperar QR code PIX após recarregar página
  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      console.log('⏳ Aguardando autenticação...');
      return;
    }
    
    // Não redirecionar se houver um pagamento PIX pendente
    const savedPixPaymentId = localStorage.getItem('pixPaymentId');
    if (savedPixPaymentId && items.length === 0) {
      console.log('📦 Pagamento PIX pendente encontrado, mantendo na página de checkout');
      // Não redirecionar para /cart se houver pagamento PIX pendente
    } else if (items.length === 0 && !savedPixPaymentId) {
      console.log('🛒 Carrinho vazio, redirecionando para /cart');
      setLocation('/cart');
      return;
    }
    
    const recoverPixPayment = async () => {
      try {
        const savedPixPaymentId = localStorage.getItem('pixPaymentId');
        console.log('🔍 Tentando recuperar pagamento PIX. ID salvo:', savedPixPaymentId);
        
        if (!savedPixPaymentId) {
          console.log('❌ Nenhum pagamento PIX salvo encontrado');
          return;
        }
        
        const paymentId = parseInt(savedPixPaymentId, 10);
        if (isNaN(paymentId)) {
          console.error('❌ ID de pagamento inválido:', savedPixPaymentId);
          localStorage.removeItem('pixPaymentId');
          return;
        }
        
        console.log('📡 Buscando pagamento do backend. ID:', paymentId);
        // Buscar pagamento do backend
        const paymentData = await paymentsAPI.getById(paymentId);
        console.log('📦 Dados do pagamento recebidos:', {
          id: paymentData.id,
          method: paymentData.paymentMethod,
          status: paymentData.status,
          hasQrCode: !!paymentData.qrCodeBase64,
          hasPixCode: !!paymentData.pixCode,
          expiresAt: paymentData.pixExpiresAt,
        });
        
        // Verificar se é um pagamento PIX pendente
        if (paymentData.paymentMethod !== 'pix') {
          console.log('❌ Não é um pagamento PIX. Método:', paymentData.paymentMethod);
          localStorage.removeItem('pixPaymentId');
          return;
        }
        
        if (paymentData.status !== 'pending') {
          console.log('❌ Pagamento não está pendente. Status:', paymentData.status);
          localStorage.removeItem('pixPaymentId');
          return;
        }
        
        // Verificar se não expirou
        if (paymentData.pixExpiresAt) {
          const expirationDate = new Date(paymentData.pixExpiresAt);
          const now = new Date();
          if (now > expirationDate) {
            console.log('⏰ QR code expirado');
            localStorage.removeItem('pixPaymentId');
            toast.warning('O QR code PIX expirou. Por favor, inicie uma nova compra.');
            return;
          }
        }
        
        // Se encontrou QR code, redirecionar para página de pagamento
        if (paymentData.qrCodeBase64 || paymentData.pixCode) {
          console.log('✅ QR code encontrado, redirecionando para página de pagamento...');
          toast.info('Redirecionando para página de pagamento...');
          setTimeout(() => {
            setLocation(`/payment/${paymentId}`);
          }, 500);
        } else {
          console.log('❌ QR code não encontrado nos dados do pagamento');
        }
      } catch (error) {
        console.error('❌ Erro ao recuperar pagamento PIX:', error);
        // Se houver erro, limpar localStorage
        localStorage.removeItem('pixPaymentId');
      }
    };
    
    recoverPixPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  // Função para calcular tempo restante
  useEffect(() => {
    if (!pixExpiresAt) {
      setTimeRemaining('');
      return;
    }

    const updateTimeRemaining = () => {
      const now = new Date();
      const expires = new Date(pixExpiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expirado');
        return;
      }

      const totalMinutes = Math.floor(diff / 60000);
      const minutes = totalMinutes;
      const seconds = Math.floor((diff % 60000) / 1000);

      if (minutes > 0) {
        setTimeRemaining(`${minutes} min ${seconds} seg`);
      } else if (seconds > 0) {
        setTimeRemaining(`${seconds} seg`);
      } else {
        setTimeRemaining('Expirado');
      }
    };

    // Atualizar imediatamente
    updateTimeRemaining();
    
    // Atualizar a cada segundo
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [pixExpiresAt]);

  // Função para verificar status do pagamento PIX
  const startPixStatusCheck = (paymentId: number) => {
    setCheckingPixStatus(true);
    
    const checkInterval = setInterval(async () => {
      try {
        const payment = await paymentsAPI.getById(paymentId);
        
        if (payment.status === 'approved') {
          clearInterval(checkInterval);
          setCheckingPixStatus(false);
          // Limpar localStorage quando pagamento for aprovado
          localStorage.removeItem('pixPaymentId');
          toast.success('Pagamento PIX confirmado!');
          clearCart();
          setTimeout(() => {
            setLocation('/checkout/success');
          }, 2000);
        } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
          clearInterval(checkInterval);
          setCheckingPixStatus(false);
          toast.error('Pagamento PIX não foi aprovado');
        }
      } catch (error) {
        console.error('Error checking PIX status:', error);
      }
    }, 5000); // Verificar a cada 5 segundos

    // Parar após 5 minutos (tempo máximo de expiração do PIX)
    setTimeout(() => {
      clearInterval(checkInterval);
      setCheckingPixStatus(false);
    }, 5 * 60 * 1000); // 5 minutos em milissegundos
  };

  // Função para verificar status do pagamento com cartão
  const startCardStatusCheck = (paymentId: number) => {
    const checkInterval = setInterval(async () => {
      try {
        const payment = await paymentsAPI.getById(paymentId);
        
        if (payment.status === 'approved') {
          clearInterval(checkInterval);
          toast.success('Pagamento aprovado!');
          clearCart();
          setTimeout(() => {
            setLocation('/checkout/success');
          }, 2000);
        } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
          clearInterval(checkInterval);
          toast.error('Pagamento não foi aprovado');
        }
      } catch (error) {
        console.error('Error checking card payment status:', error);
      }
    }, 5000); // Verificar a cada 5 segundos

    // Parar após 10 minutos
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 10 * 60 * 1000);
  };

  // Função para calcular frete (v2.0)
  const calculateShipping = async (zipCode: string) => {
    if (!zipCode || zipCode.replace(/\D/g, '').length !== 8) {
      return;
    }

    setLoadingShipping(true);
    try {
      // Validar CEP
      if (!zipCode || zipCode.replace(/\D/g, '').length !== 8) {
        console.warn('CEP inválido para cálculo de frete:', zipCode);
        setShippingOptions([storePickupOption]);
        setSelectedShipping(storePickupOption);
        setLoadingShipping(false);
        return;
      }
      
      const zipCodeDigits = zipCode.replace(/\D/g, '');
      
      // Calcular peso total dos itens
      const totalWeight = items.reduce((sum, item) => {
        return sum + (item.product.weight || 0.3) * item.quantity; // Peso padrão: 300g por item
      }, 0);

      // Calcular dimensões baseado nos itens
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const dimensions = {
        height: Math.max(20, totalItems * 5), // Altura mínima 20cm, +5cm por item
        width: 20,
        length: 20,
      };
      
      // Calcular valor total para valor declarado
      const totalValue = items.reduce((sum, item) => {
        return sum + (item.product.price * item.quantity);
      }, 0);

      // Buscar opções de frete
      const response = await shippingAPI.calculate({
        destinationZipCode: zipCodeDigits,
        weight: totalWeight,
        dimensions: dimensions,
        value: totalValue,
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      });

      // Adicionar opção de retirada na loja
      const options = [storePickupOption, ...(response.options || [])];
      setShippingOptions(options);
      
      // Selecionar primeira opção por padrão
      if (options.length > 0) {
        setSelectedShipping(options[0]);
      }
    } catch (error) {
      console.error('Error calculating shipping:', error);
      // Em caso de erro, ainda oferecer retirada na loja
      setShippingOptions([storePickupOption]);
      setSelectedShipping(storePickupOption);
    } finally {
      setLoadingShipping(false);
    }
  };

  // Função para buscar CEP (v2.0)
  const handleCEPBlur = async () => {
    const zipCodeDigits = formData.zipCode.replace(/\D/g, '');
    if (zipCodeDigits.length !== 8) {
      return;
    }

    setLoadingCEP(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${zipCodeDigits}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
          zipCode: zipCodeDigits.replace(/(\d{5})(\d{3})/, '$1-$2'),
        }));
        
        // Calcular frete automaticamente
        calculateShipping(zipCodeDigits);
      }
    } catch (error) {
      console.error('Error fetching CEP:', error);
    } finally {
      setLoadingCEP(false);
    }
  };


  // Função para remover cupom
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.info('Cupom removido');
  };

  // Função para tokenizar cartão (preparar dados para Asaas)
  const tokenizeCard = async (): Promise<string | null> => {
    try {
      const cardNumber = formData.cardNumber.replace(/\D/g, '');
      const cardExpiry = formData.cardExpiry.replace(/\D/g, '');
      const cardCvc = formData.cardCvc;
      const cardHolderName = formData.cardHolderName;
      const cardHolderCpf = formData.cardHolderCpf.replace(/\D/g, '');

      // Validar dados do cartão
      if (cardNumber.length < 13 || cardNumber.length > 19) {
        throw new Error('Número do cartão inválido');
      }

      if (cardExpiry.length !== 4) {
        throw new Error('Validade do cartão inválida');
      }

      if (cardCvc.length < 3 || cardCvc.length > 4) {
        throw new Error('CVC inválido');
      }

      if (!cardHolderName || cardHolderName.trim().length < 3) {
        throw new Error('Nome do portador inválido');
      }

      if (cardHolderCpf.length !== 11) {
        throw new Error('CPF inválido');
      }

      // Separar mês e ano da validade (formato MM/AA)
      const expiryMonth = cardExpiry.substring(0, 2);
      const expiryYear = '20' + cardExpiry.substring(2, 4);

      // Preparar dados do cartão no formato esperado pelo backend
      const cardData = {
        cardNumber: cardNumber,
        cardExpirationMonth: expiryMonth,
        cardExpirationYear: expiryYear,
        securityCode: cardCvc,
        cardholderName: cardHolderName,
        identificationType: 'CPF',
        identificationNumber: cardHolderCpf,
      };

      // Preparar dados do cartão para envio ao backend (Asaas processa diretamente)
      const result = await paymentsAPI.tokenizeCard(cardData);
      
      if (result && result.id) {
        return result.id; // Retorna JSON string com dados do cartão
      }
      
      throw new Error('Não foi possível preparar os dados do cartão');
    } catch (error: unknown) {
      console.error('Error tokenizing card:', error);
      
      let errorMessage = 'Erro ao processar dados do cartão. Verifique os dados e tente novamente.';
      
      if (isApiError(error)) {
        const errorData = error.response?.data;
        if (errorData) {
          // Tentar extrair mensagem de erro mais específica
          if (errorData.details) {
            const details = errorData.details;
            if (Array.isArray(details)) {
              const causeMessages = details
                .map((c: any) => {
                  if (typeof c === 'string') return c;
                  if (typeof c === 'object' && c !== null) {
                    const causeObj = c as any;
                    return causeObj.description || causeObj.message || JSON.stringify(c);
                  }
                  return JSON.stringify(c);
                })
                .filter((msg: string) => msg && msg.length > 0);
              
              if (causeMessages.length > 0) {
                errorMessage = causeMessages.join(', ');
              }
            } else if (typeof details === 'string') {
              errorMessage = details;
            }
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error('Erro ao processar cartão', {
        description: errorMessage,
      });
      
      return null;
    }
  };

  // Handler do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPaymentMethod) {
      toast.error('Selecione um método de pagamento');
      return;
    }

    if (!selectedShipping) {
      toast.error('Selecione uma opção de frete');
      return;
    }

    // Validar endereço se for novo
    if (isNewAddress) {
      const requiredFields: Record<string, string> = {
        fullName: 'Nome completo',
        address: 'Endereço',
        neighborhood: 'Bairro',
        city: 'Cidade',
        state: 'Estado',
        zipCode: 'CEP',
        phone: 'Telefone',
      };

      const missingFields: string[] = [];
      for (const [field, label] of Object.entries(requiredFields)) {
        if (!formData[field as keyof typeof formData] || formData[field as keyof typeof formData].trim() === '') {
          missingFields.push(label);
        }
      }

      if (missingFields.length > 0) {
        toast.error('Preencha todos os campos obrigatórios', {
          description: `Campos faltando: ${missingFields.join(', ')}`,
        });
        return;
      }

      // Validar CEP
      const zipCodeDigits = formData.zipCode.replace(/\D/g, '');
      if (zipCodeDigits.length !== 8) {
        toast.error('CEP inválido', {
          description: 'O CEP deve conter 8 dígitos',
        });
        return;
      }
    } else if (!selectedAddressId) {
      toast.error('Selecione um endereço de entrega');
      return;
    }

    setIsProcessing(true);

    try {
      // Preparar dados do pedido
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      }));

      // Preparar endereço de entrega (v2.0)
      let shippingAddress = `${formData.address}, ${formData.city}, ${formData.state} - CEP: ${formData.zipCode}`;
      let shippingAddressId: number | undefined;
      let shippingCost: number = 0;
      let shippingMethod: string | undefined;

      // Se usar endereço salvo
      if (selectedAddressId && !isNewAddress) {
        shippingAddressId = selectedAddressId;
        const address = userAddresses.find((addr) => addr.id === selectedAddressId);
        if (address) {
          shippingAddress = `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''}, ${address.neighborhood}, ${address.city}, ${address.state} - CEP: ${address.zipCode}`;
        }
      } else if (isNewAddress) {
        // Salvar novo endereço se o usuário preencheu um endereço novo (v2.0)
        try {
          // Verificar se CEP está completo
          const zipCodeDigits = formData.zipCode.replace(/\D/g, '');
          if (zipCodeDigits.length === 8) {
            // Processar endereço de forma mais robusta
            // Dividir endereço em partes (Rua, Número, Complemento)
            const addressParts = formData.address.split(',').map(part => part.trim()).filter(part => part.length > 0);
            
            // Extrair número do endereço (pode estar no final da primeira parte ou na segunda)
            let street = addressParts[0] || formData.address;
            let number = 'S/N';
            let complement = '';
            
            // Tentar extrair número da primeira parte (ex: "Rua X, 123" ou "Rua X 123")
            const numberMatch = street.match(/\s+(\d+)$/);
            if (numberMatch) {
              number = numberMatch[1];
              street = street.replace(/\s+\d+$/, '').trim();
            } else if (addressParts.length > 1) {
              // Se não encontrou número na primeira parte, usar a segunda
              const secondPart = addressParts[1];
              if (/^\d+/.test(secondPart)) {
                number = secondPart.match(/^\d+/)?.[0] || 'S/N';
                complement = secondPart.replace(/^\d+\s*/, '').trim();
              } else {
                complement = secondPart;
              }
            }
            
            // Complemento pode estar na terceira parte
            if (addressParts.length > 2 && !complement) {
              complement = addressParts.slice(2).join(', ');
            }
            
            const addressData = {
              label: 'Endereço Principal',
              street: street || formData.address, // Rua
              number: number, // Número
              complement: complement || '', // Complemento
              neighborhood: formData.neighborhood || '', // Bairro (do campo específico)
              city: formData.city,
              state: formData.state.toUpperCase(),
              zipCode: zipCodeDigits,
              recipientName: formData.fullName,
              phone: formData.phone,
              isDefault: userAddresses.length === 0, // Ser padrão se for o primeiro
            };

            const newAddress = await addressesAPI.create(addressData);
            shippingAddressId = newAddress.address.id;
            shippingAddress = `${addressData.street}, ${addressData.number}${addressData.complement ? ` - ${addressData.complement}` : ''}, ${addressData.neighborhood}, ${addressData.city}, ${addressData.state} - CEP: ${addressData.zipCode}`;
            
            // Atualizar lista de endereços
            setUserAddresses([...userAddresses, newAddress.address]);
          }
        } catch (error) {
          console.error('Error saving new address:', error);
          // Continuar mesmo se não conseguir salvar o endereço
        }
      }

      // Calcular frete se selecionado (v2.0)
      if (selectedShipping) {
        shippingCost = selectedShipping.price;
        shippingMethod = selectedShipping.service;
      }

      // Calcular total final (incluindo frete)
      const subtotal = appliedCoupon ? appliedCoupon.finalTotal : totalPrice;
      const finalTotal = subtotal + shippingCost;

      // Criar pedido via API (v2.0 - com informações de frete)
      const order = await ordersAPI.create({
        items: orderItems,
        shippingAddress,
        shippingAddressId,
        shippingCost,
        shippingMethod,
        paymentMethod: selectedPaymentMethod,
        couponCode: appliedCoupon?.code,
      });

      // Criar registro de pagamento (v2.0)
      const paymentData: PaymentData = {
        gateway: 'asaas', // Integrado com Asaas
        paymentMethod: selectedPaymentMethod,
        installments: selectedPaymentMethod === 'credit_card' ? (installments || 1) : 1,
        amount: finalTotal,
      };

      // Validar campos do cartão se for crédito ou débito
      if (selectedPaymentMethod === 'credit_card' || selectedPaymentMethod === 'debit_card') {
        // Validar parcelamento se for cartão de crédito
        if (selectedPaymentMethod === 'credit_card' && (!installments || installments < 1)) {
          toast.error('Parcelamento obrigatório', {
            description: 'Por favor, selecione o número de parcelas.',
          });
          setIsProcessing(false);
          return;
        }
        
        // Validar campos obrigatórios do cartão
        if (!formData.cardNumber || formData.cardNumber.replace(/\D/g, '').length < 13) {
          toast.error('Número do cartão inválido', {
            description: 'Por favor, preencha o número do cartão corretamente.',
          });
          setIsProcessing(false);
          return;
        }

        if (!formData.cardExpiry || formData.cardExpiry.length < 5) {
          toast.error('Validade do cartão inválida', {
            description: 'Por favor, preencha a validade no formato MM/AA.',
          });
          setIsProcessing(false);
          return;
        }

        if (!formData.cardCvc || formData.cardCvc.length < 3) {
          toast.error('CVC inválido', {
            description: 'Por favor, preencha o CVC do cartão.',
          });
          setIsProcessing(false);
          return;
        }

        if (!formData.cardHolderName || formData.cardHolderName.trim().length < 3) {
          toast.error('Nome do portador inválido', {
            description: 'Por favor, preencha o nome do portador do cartão.',
          });
          setIsProcessing(false);
          return;
        }

        if (!formData.cardHolderCpf || formData.cardHolderCpf.replace(/\D/g, '').length !== 11) {
          toast.error('CPF inválido', {
            description: 'Por favor, preencha o CPF do portador do cartão.',
          });
          setIsProcessing(false);
          return;
        }

        // Extrair últimos 4 dígitos para salvar no banco
        const cardDigits = formData.cardNumber.replace(/\D/g, '');
        paymentData.cardLastDigits = cardDigits.slice(-4);
      }

      // Criar registro de pagamento
      const payment = await paymentsAPI.create(order.id, paymentData);

      // Processar pagamento baseado no método selecionado
      try {
        // Se for PIX, processar diretamente na página (Checkout Transparente)
        if (selectedPaymentMethod === 'pix') {
          const pixResult = await paymentsAPI.processPix(payment.id);
          
          console.log('PIX payment result:', pixResult);
          
          // Verificar QR Code em diferentes estruturas possíveis da resposta
          const qrCodeBase64 = pixResult.qrCodeBase64 || pixResult.payment?.qrCodeBase64 || pixResult.qrCode || pixResult.payment?.qrCode;
          const pixCode = pixResult.pixCode || pixResult.payment?.pixCode || pixResult.code || pixResult.payment?.code;
          const pixExpiresAt = pixResult.pixExpiresAt || pixResult.payment?.pixExpiresAt || pixResult.expiresAt || pixResult.payment?.expiresAt;
          
          if (qrCodeBase64 || pixCode) {
            // Armazenar informações do PIX
            // Adicionar prefixo data:image/png;base64, se não tiver (necessário para exibir a imagem)
            let qrCodeImage = qrCodeBase64 || null;
            if (qrCodeImage && !qrCodeImage.startsWith('data:')) {
              qrCodeImage = `data:image/png;base64,${qrCodeImage}`;
            }
            setPixQrCode(qrCodeImage);
            setPixCode(pixCode || null);
            
            // Definir data de expiração (5 minutos se não fornecida pelo Asaas)
            let expirationDate: Date;
            if (pixExpiresAt) {
              expirationDate = new Date(pixExpiresAt);
              console.log('PIX expiration from Asaas:', expirationDate);
            } else {
              // Fallback: 5 minutos a partir de agora
              expirationDate = new Date();
              expirationDate.setMinutes(expirationDate.getMinutes() + 5);
              console.log('PIX expiration (fallback 5min):', expirationDate);
            }
            
            setPixExpiresAt(expirationDate);
            setPixPaymentId(payment.id);
            
            // Salvar pixPaymentId no localStorage para recuperar após recarregar página
            localStorage.setItem('pixPaymentId', payment.id.toString());
            
            // Rastrear compra iniciada
            const purchaseItems = items.map((item) => ({
              productId: item.product.id.toString(),
              name: item.product.name,
              quantity: item.quantity,
              price: item.product.price,
            }));
            
            AnalyticsEvents.purchase(
              order.id.toString(),
              finalTotal,
              purchaseItems,
              appliedCoupon?.code
            );

            // Redirecionar para página de pagamento
            setIsProcessing(false);
            toast.success('QR Code PIX gerado! Redirecionando...');
            setTimeout(() => {
              setLocation(`/payment/${payment.id}`);
            }, 500);
            return;
          } else {
            // Se não houver QR Code, verificar se o pagamento foi criado e tentar buscar novamente
            console.warn('QR Code PIX não encontrado na resposta. Estrutura completa:', pixResult);
            
            // Se o pagamento foi criado, pode ser que o QR Code ainda esteja sendo gerado
            if (pixResult.payment || payment.id) {
              toast.warning('QR Code PIX ainda não está disponível', {
                description: 'O pagamento foi criado, mas o QR Code ainda está sendo gerado. Aguarde alguns segundos...',
              });
              
              // Tentar buscar o pagamento múltiplas vezes (até 5 tentativas)
              let attempts = 0;
              const maxAttempts = 5;
              
              const tryFetchQrCode = async () => {
                attempts++;
                try {
                  console.log(`🔄 Tentativa ${attempts}/${maxAttempts} de buscar QR Code...`);
                  
                  // Buscar o pagamento atualizado
                  const paymentData = await paymentsAPI.getById(payment.id);
                  
                  // Verificar se o QR Code está disponível agora
                  const foundQrCode = paymentData.qrCodeBase64 || paymentData.pixCode;
                  
                  if (foundQrCode) {
                    console.log('✅ QR Code encontrado!');
                    // Adicionar prefixo data:image/png;base64, se não tiver (necessário para exibir a imagem)
                    let qrCodeImage = paymentData.qrCodeBase64 || null;
                    if (qrCodeImage && !qrCodeImage.startsWith('data:')) {
                      qrCodeImage = `data:image/png;base64,${qrCodeImage}`;
                    }
                    setPixQrCode(qrCodeImage);
                    setPixCode(paymentData.pixCode || null);
                    setPixPaymentId(payment.id);
                    
                    // Salvar pixPaymentId no localStorage para recuperar após recarregar página
                    localStorage.setItem('pixPaymentId', payment.id.toString());
                    
                    // Definir data de expiração
                    if (paymentData.pixExpiresAt) {
                      const expirationDate = new Date(paymentData.pixExpiresAt);
                      setPixExpiresAt(expirationDate);
                      
                      // Inicializar contador
                      const now = new Date();
                      const diff = expirationDate.getTime() - now.getTime();
                      const minutes = Math.floor(diff / 60000);
                      const seconds = Math.floor((diff % 60000) / 1000);
                      if (minutes > 0) {
                        setTimeRemaining(`${minutes} min ${seconds} seg`);
                      } else if (seconds > 0) {
                        setTimeRemaining(`${seconds} seg`);
                      }
                    }
                    
                    // Iniciar verificação do status do pagamento PIX
                    startPixStatusCheck(payment.id);
                    
                    toast.success('QR Code PIX gerado! Redirecionando...');
                    setIsProcessing(false);
                    
                    // Redirecionar para página de pagamento
                    setTimeout(() => {
                      setLocation(`/payment/${payment.id}`);
                    }, 500);
                    
                    return;
                  }
                  
                  // Se ainda não encontrou e não excedeu tentativas, tentar novamente
                  if (attempts < maxAttempts) {
                    setTimeout(tryFetchQrCode, 2000); // Tentar novamente em 2 segundos
                  } else {
                    console.error('❌ QR Code não encontrado após múltiplas tentativas');
                    toast.error('Não foi possível gerar o QR Code PIX', {
                      description: 'Por favor, tente novamente ou entre em contato com o suporte.',
                    });
                    setIsProcessing(false);
                  }
                } catch (error) {
                  console.error(`Erro ao buscar QR Code (tentativa ${attempts}):`, error);
                  if (attempts < maxAttempts) {
                    setTimeout(tryFetchQrCode, 2000);
                  } else {
                    toast.error('Erro ao buscar QR Code PIX', {
                      description: 'Por favor, tente novamente.',
                    });
                    setIsProcessing(false);
                  }
                }
              };
              
              // Iniciar primeira tentativa após 2 segundos
              setTimeout(tryFetchQrCode, 2000);
              
              setIsProcessing(false);
              return;
            }
            
            throw new Error('QR Code PIX não foi gerado. Por favor, tente novamente.');
          }
        }

        // Para cartão de crédito e débito, processar diretamente na página (Checkout Transparente)
        if (selectedPaymentMethod === 'credit_card' || selectedPaymentMethod === 'debit_card') {
          // Tokenizar cartão
          toast.info('Processando pagamento...', {
            description: 'Aguarde enquanto processamos seu pagamento.',
          });

          try {
            const cardToken = await tokenizeCard();
            
            if (!cardToken) {
              throw new Error('Não foi possível preparar os dados do cartão');
            }

            console.log('Card data prepared:', cardToken);

            // Validar parcelamento antes de processar pagamento com cartão
            if (selectedPaymentMethod === 'credit_card' && (!installments || installments < 1)) {
              toast.error('Parcelamento obrigatório', {
                description: 'Por favor, selecione o número de parcelas antes de processar o pagamento.',
              });
              setIsProcessing(false);
              return;
            }
            
            // Log para debug
            console.log('Processing card payment - Frontend data:', {
              selectedPaymentMethod,
              installments,
              paymentId: payment.id,
            });
            
            // Processar pagamento com dados do cartão (Asaas processa diretamente no backend)
            // Garantir que installments seja um número válido
            const finalInstallments = selectedPaymentMethod === 'credit_card' 
              ? (installments && installments > 0 ? Number(installments) : 1)
              : 1;
            
            console.log('Sending to processCard API:', {
              paymentId: payment.id,
              hasToken: !!cardToken,
              installments: finalInstallments,
              installmentsType: typeof finalInstallments,
              paymentMethodId: selectedPaymentMethod === 'credit_card' ? 'credit_card' : 'debit_card',
            });
            
            const cardResult = await paymentsAPI.processCard({
              paymentId: payment.id,
              token: cardToken,
              installments: finalInstallments,
              paymentMethodId: selectedPaymentMethod === 'credit_card' ? 'credit_card' : 'debit_card',
            });

            console.log('Card payment result:', cardResult);

            if (cardResult.payment) {
              const paymentStatus = cardResult.payment.status;
              
              console.log('Payment status:', paymentStatus);
              console.log('Payment status_detail:', cardResult.payment.status_detail);
              console.log('Payment ID:', cardResult.payment.id);

              // Rastrear compra iniciada
              const purchaseItems = items.map((item) => ({
                productId: item.product.id.toString(),
                name: item.product.name,
                quantity: item.quantity,
                price: item.product.price,
              }));
              
              AnalyticsEvents.purchase(
                order.id.toString(),
                finalTotal,
                purchaseItems,
                appliedCoupon?.code
              );

              if (paymentStatus === 'approved') {
                toast.success('Pagamento aprovado!');
                clearCart();
                setTimeout(() => {
                  setLocation('/checkout/success');
                }, 2000);
              } else if (paymentStatus === 'pending' || paymentStatus === 'in_process') {
                toast.info('Pagamento em processamento', {
                  description: 'Seu pagamento está sendo processado. Você receberá uma confirmação em breve.',
                });
                // Verificar status periodicamente
                startCardStatusCheck(payment.id);
              } else if (paymentStatus === 'rejected') {
                // Mensagens de erro mais específicas baseadas no status_detail
                let errorMessage = 'Seu pagamento foi rejeitado. Verifique os dados do cartão.';
                const statusDetail = cardResult.payment.status_detail;
                
                if (statusDetail === 'cc_rejected_high_risk') {
                  errorMessage = 'Pagamento rejeitado por alto risco. Verifique os dados do cartão ou entre em contato com o suporte.';
                } else if (statusDetail === 'cc_rejected_insufficient_amount') {
                  errorMessage = 'Saldo insuficiente no cartão.';
                } else if (statusDetail === 'cc_rejected_bad_filled_card_number') {
                  errorMessage = 'Número do cartão inválido.';
                } else if (statusDetail === 'cc_rejected_bad_filled_date') {
                  errorMessage = 'Data de validade inválida.';
                } else if (statusDetail === 'cc_rejected_bad_filled_other') {
                  errorMessage = 'Dados do cartão inválidos.';
                } else if (statusDetail === 'cc_rejected_bad_filled_security_code') {
                  errorMessage = 'Código de segurança (CVV) inválido.';
                } else if (statusDetail === 'cc_rejected_other_reason') {
                  errorMessage = 'Pagamento rejeitado. Entre em contato com o banco emissor do cartão.';
                } else if (statusDetail) {
                  errorMessage = `Pagamento rejeitado: ${statusDetail}`;
                }
                
                toast.error('Pagamento rejeitado', {
                  description: errorMessage,
                });
                setIsProcessing(false);
                return;
              } else {
                toast.warning(`Status do pagamento: ${paymentStatus}`, {
                  description: cardResult.payment.status_detail || 'Verifique o status do pagamento em seus pedidos.',
                });
                setIsProcessing(false);
                return;
              }
            } else {
              throw new Error('Resposta do pagamento inválida');
            }
          } catch (cardError: unknown) {
            console.error('Error processing card payment:', cardError);
            
            // Extrair mensagem de erro mais detalhada
            let errorMessage = 'Erro ao processar pagamento com cartão. Verifique os dados e tente novamente.';
            
            if (isApiError(cardError)) {
              console.error('Error response:', cardError.response);
              console.error('Error response data:', cardError.response?.data);
              console.error('Error response details:', cardError.response?.data?.details);
              
              if (cardError.response?.data) {
                const errorData = cardError.response.data;
                if (errorData.details) {
                  errorMessage = errorData.details;
                } else if (errorData.error) {
                  errorMessage = errorData.error;
                } else if (errorData.message) {
                  errorMessage = errorData.message;
                }
              } else if (cardError.message) {
                errorMessage = cardError.message;
              }
            } else if (cardError instanceof Error) {
              errorMessage = cardError.message;
            }
            
            console.error('Final error message:', errorMessage);
            toast.error('Erro ao processar pagamento', {
              description: errorMessage,
            });
            setIsProcessing(false);
            return;
          }
        }
      } catch (paymentError: unknown) {
        console.error('Error processing payment:', paymentError);
        const errorMessage = getErrorMessage(paymentError) || 'Não foi possível processar o pagamento. Tente novamente.';
        if (isApiError(paymentError)) {
          console.error('Payment error details:', {
            status: paymentError.response?.status,
            data: paymentError.response?.data,
            message: errorMessage,
          });
        }
        toast.error('Erro ao processar pagamento', {
          description: errorMessage,
        });
        setIsProcessing(false);
        return;
      }
    } catch (error: unknown) {
      console.error('Error creating order:', error);
      
      // Tratamento especial para erro 429 (Too Many Requests)
      if (isApiError(error) && error.response?.status === 429) {
        const retryAfter = error.response?.data?.retryAfter || 15 * 60;
        const minutes = Math.ceil(retryAfter / 60);
        toast.error('Muitas tentativas de checkout', {
          description: `Você fez muitas tentativas. Por favor, aguarde ${minutes} minuto${minutes > 1 ? 's' : ''} antes de tentar novamente.`,
          duration: 10000,
        });
      } else {
        const errorMessage = getErrorMessage(error) || 'Tente novamente mais tarde.';
        toast.error('Erro ao criar pedido', {
          description: errorMessage,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-8 text-sky-500" style={{ fontSize: '2.5rem', fontWeight: 900 }}>
        Finalizar Compra
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Checkout Form */}
          <div className="space-y-8">
            {/* Shipping Information */}
            <div className="rounded-2xl bg-white p-6 shadow-md">
              <h2 className="mb-6 text-sky-500" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                Informações de Entrega
              </h2>

              {/* Seleção de endereço (v2.0) */}
              <div className="mb-6">
                <Label className="mb-2 block">Endereço de Entrega</Label>
                <RadioGroup
                  value={isNewAddress ? 'new' : selectedAddressId?.toString() || ''}
                  onValueChange={(value) => {
                    if (value === 'new') {
                      setIsNewAddress(true);
                      setSelectedAddressId(null);
                    } else {
                      setIsNewAddress(false);
                      setSelectedAddressId(Number(value));
                      const address = userAddresses.find((addr) => addr.id === Number(value));
                      if (address) {
                        setFormData(prev => ({
                          ...prev,
                          fullName: address.recipientName || user?.name || '',
                          phone: address.phone || '',
                          address: `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''}`,
                          city: address.city,
                          state: address.state,
                          zipCode: address.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2'),
                        }));
                        calculateShipping(address.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2'));
                      }
                    }
                  }}
                >
                  {userAddresses.map((address) => (
                    <div key={address.id} className="mb-2 flex items-start space-x-2">
                      <RadioGroupItem value={address.id.toString()} id={`address-${address.id}`} />
                      <Label htmlFor={`address-${address.id}`} className="flex-1 cursor-pointer">
                        <div className="font-medium">{address.label || 'Endereço'}</div>
                        <div className="text-sm text-gray-600">
                          {address.street}, {address.number}
                          {address.complement && ` - ${address.complement}`}
                          <br />
                          {address.neighborhood}, {address.city} - {address.state}
                          <br />
                          CEP: {address.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2')}
                        </div>
                      </Label>
                    </div>
                  ))}
                  <div className="mb-2 flex items-start space-x-2">
                    <RadioGroupItem value="new" id="address-new" />
                    <Label htmlFor="address-new" className="flex-1 cursor-pointer">
                      <div className="font-medium">Novo Endereço</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Formulário de endereço (v2.0) */}
              {isNewAddress && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Nome Completo *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(00) 00000-0000"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="zipCode">CEP *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          const formatted = value.replace(/(\d{5})(\d{3})/, '$1-$2');
                          setFormData({ ...formData, zipCode: formatted });
                        }}
                        onBlur={handleCEPBlur}
                        placeholder="00000-000"
                        maxLength={9}
                        required
                      />
                      {loadingCEP && <Loader2 className="h-5 w-5 animate-spin text-sky-500" />}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Endereço *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, Avenida, etc."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="neighborhood">Bairro *</Label>
                      <Input
                        id="neighborhood"
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                      placeholder="SP"
                      maxLength={2}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Shipping Options (v2.0) */}
            {!loadingShipping && shippingOptions.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-md">
                <h2 className="mb-6 text-sky-500" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  Opções de Frete
                </h2>
                <RadioGroup
                  value={selectedShipping?.service || ''}
                  onValueChange={(value) => {
                    const option = shippingOptions.find((opt) => opt.service === value);
                    if (option) {
                      setSelectedShipping(option);
                    }
                  }}
                >
                  {shippingOptions.map((option) => (
                    <div key={option.service} className="mb-2 flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value={option.service} id={`shipping-${option.service}`} />
                        <Label htmlFor={`shipping-${option.service}`} className="cursor-pointer">
                          <div className="font-medium">{option.name}</div>
                          {option.estimatedDays > 0 && (
                            <div className="text-sm text-gray-600">
                              Prazo estimado: {option.estimatedDays} dia(s)
                            </div>
                          )}
                        </Label>
                      </div>
                      <div className="font-bold text-sky-500">
                        {option.price === 0 ? 'Grátis' : `R$ ${option.price.toFixed(2).replace('.', ',')}`}
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {loadingShipping && (
              <div className="rounded-2xl bg-white p-6 shadow-md">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                  <span className="ml-3 text-gray-600">Calculando frete...</span>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="rounded-2xl bg-white p-6 shadow-md">
              <h2 className="mb-6 text-sky-500" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                Método de Pagamento
              </h2>
              <PaymentMethodSelector
                selectedMethod={selectedPaymentMethod}
                onMethodChange={setSelectedPaymentMethod}
                installments={installments}
                onInstallmentsChange={setInstallments}
                totalAmount={
                  (appliedCoupon ? appliedCoupon.finalTotal : totalPrice) +
                  (selectedShipping?.price || 0)
                }
              />
            </div>

            {/* Card Details (v2.0) */}
            {(selectedPaymentMethod === 'credit_card' || selectedPaymentMethod === 'debit_card') && (
              <div className="rounded-2xl bg-white p-6 shadow-md">
                <h2 className="mb-6 text-sky-500" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  Dados do Cartão
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Número do Cartão *</Label>
                    <Input
                      id="cardNumber"
                      value={formData.cardNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                        setFormData({ ...formData, cardNumber: formatted });
                      }}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cardExpiry">Validade *</Label>
                      <Input
                        id="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          const formatted = value.replace(/(\d{2})(\d{2})/, '$1/$2');
                          setFormData({ ...formData, cardExpiry: formatted });
                        }}
                        placeholder="MM/AA"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardCvc">CVC *</Label>
                      <Input
                        id="cardCvc"
                        value={formData.cardCvc}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setFormData({ ...formData, cardCvc: value });
                        }}
                        placeholder="000"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cardHolderName">Nome do Portador *</Label>
                    <Input
                      id="cardHolderName"
                      value={formData.cardHolderName}
                      onChange={(e) => setFormData({ ...formData, cardHolderName: e.target.value })}
                      placeholder="Nome como está no cartão"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cardHolderCpf">CPF do Portador *</Label>
                    <Input
                      id="cardHolderCpf"
                      value={formData.cardHolderCpf}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        const formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                        setFormData({ ...formData, cardHolderCpf: formatted });
                      }}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PIX Payment Section */}
            {pixPaymentId && (pixQrCode || pixCode) && (
              <div id="pix-payment-section" className="rounded-2xl bg-white p-6 shadow-md">
                <h2 className="mb-4 text-sky-500" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  Pagamento PIX
                </h2>
                {pixExpiresAt && (
                  <div className="mb-4 rounded-lg bg-yellow-50 p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Tempo restante:</strong> {timeRemaining || 'Calculando...'}
                    </p>
                  </div>
                )}
                {pixQrCode && (
                  <div className="mb-4 flex flex-col items-center">
                    <img src={pixQrCode} alt="QR Code PIX" className="mb-4 h-64 w-64" />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (pixCode) {
                          navigator.clipboard.writeText(pixCode);
                          toast.success('Código PIX copiado!');
                        } else {
                          toast.error('Código PIX não disponível');
                        }
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Código PIX
                    </Button>
                  </div>
                )}
                {pixCode && !pixQrCode && (
                  <div className="mb-4">
                    <Label>Código PIX</Label>
                    <div className="flex gap-2">
                      <Input value={pixCode} readOnly />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigator.clipboard.writeText(pixCode);
                          toast.success('Código PIX copiado!');
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {checkingPixStatus && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
                    <span className="ml-2 text-sm text-gray-600">Verificando pagamento...</span>
                  </div>
                )}
              </div>
            )}

            {/* Coupon Section */}
            <div className="rounded-2xl bg-white p-6 shadow-md">
              <CouponInput
                subtotal={totalPrice}
                onCouponApplied={(coupon) => {
                  // O CouponInput já retorna o cupom validado, mas precisamos buscar o tipo do cupom
                  // Por enquanto, vamos usar 'fixed' como padrão, mas isso será ajustado quando a API retornar o tipo
                  setAppliedCoupon({
                    code: coupon.code,
                    discount: coupon.discountAmount,
                    discountType: 'fixed' as const, // Será ajustado quando a API retornar o tipo correto
                    finalTotal: coupon.finalTotal,
                  });
                }}
                onCouponRemoved={handleRemoveCoupon}
                appliedCoupon={appliedCoupon ? {
                  code: appliedCoupon.code,
                  discountAmount: appliedCoupon.discount,
                  finalTotal: appliedCoupon.finalTotal,
                } : null}
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-md">
              <h2 className="mb-6 text-sky-500" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                Resumo do Pedido
              </h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex items-center gap-4">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-orange-50">
                      <ImageWithFallback
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.size && `Tamanho: ${item.size}`}
                        {item.size && item.color && ' • '}
                        {item.color && `Cor: ${item.color}`}
                      </p>
                      <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                    </div>
                    <div className="font-bold text-sky-500">
                      R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto ({appliedCoupon.code})</span>
                    <span>
                      -R${' '}
                      {appliedCoupon.discountType === 'percentage'
                        ? ((totalPrice * appliedCoupon.discount) / 100).toFixed(2)
                        : appliedCoupon.discount.toFixed(2)}
                    </span>
                  </div>
                )}
                {selectedShipping && (
                  <div className="flex justify-between">
                    <span>Frete ({selectedShipping.name})</span>
                    <span>
                      {selectedShipping.price === 0
                        ? 'Grátis'
                        : `R$ ${selectedShipping.price.toFixed(2).replace('.', ',')}`}
                    </span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-sky-500">
                    R${' '}
                    {(
                      (appliedCoupon ? appliedCoupon.finalTotal : totalPrice) +
                      (selectedShipping?.price || 0)
                    ).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isProcessing || !selectedPaymentMethod || !selectedShipping}
            >
              {isProcessing ? 'Processando...' : 'Finalizar Pedido'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

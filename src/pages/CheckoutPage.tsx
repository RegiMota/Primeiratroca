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
import { MapPin, Plus, Check, Search } from 'lucide-react';
import { AnalyticsEvents } from '../lib/analytics';

export function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; finalTotal: number } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [installments, setInstallments] = useState(1);

  // Estados para endereços e frete (v2.0)
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [isNewAddress, setIsNewAddress] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);

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

    if (items.length === 0) {
      setLocation('/cart');
      return;
    }

    // Carregar endereços salvos
    const loadAddresses = async () => {
      try {
        const response = await addressesAPI.getAll();
        setUserAddresses(response.addresses || []);
        
        // Selecionar endereço padrão se existir
        const defaultAddress = response.addresses?.find((addr: any) => addr.isDefault);
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

  if (!isAuthenticated || items.length === 0) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });

    // Formatar CEP automaticamente
    if (e.target.name === 'zipCode') {
      const zipCode = value.replace(/\D/g, '').slice(0, 8);
      const formattedZipCode = zipCode.replace(/(\d{5})(\d{3})/, '$1-$2');
      setFormData(prev => ({ ...prev, zipCode: formattedZipCode }));
      
      // Calcular frete quando CEP estiver completo (v2.0)
      if (zipCode.length === 8) {
        calculateShipping(formattedZipCode);
      }
    }
  };

  // Buscar endereço por CEP usando ViaCEP (v2.0)
  const searchCEP = async (cep: string) => {
    const cepDigits = cep.replace(/\D/g, '');
    
    if (cepDigits.length !== 8) {
      toast.error('CEP inválido', {
        description: 'O CEP deve conter 8 dígitos',
      });
      return;
    }

    setLoadingCEP(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado', {
          description: 'Por favor, verifique o CEP e tente novamente.',
        });
        return;
      }

      // Preencher campos automaticamente
      setFormData(prev => ({
        ...prev,
        address: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        zipCode: cepDigits.replace(/(\d{5})(\d{3})/, '$1-$2'),
      }));

      toast.success('Endereço encontrado!', {
        description: 'Os campos foram preenchidos automaticamente.',
      });

      // Calcular frete automaticamente após buscar CEP
      calculateShipping(cepDigits.replace(/(\d{5})(\d{3})/, '$1-$2'));
    } catch (error) {
      console.error('Error searching CEP:', error);
      toast.error('Erro ao buscar CEP', {
        description: 'Tente novamente mais tarde.',
      });
    } finally {
      setLoadingCEP(false);
    }
  };

  // Calcular opções de frete (v2.0)
  const calculateShipping = async (destinationZipCode: string) => {
    if (!destinationZipCode || destinationZipCode.replace(/\D/g, '').length !== 8) {
      return;
    }

    setLoadingShipping(true);

    try {
      // Calcular peso total (simulado: 200g por item)
      const totalWeight = items.reduce((sum, item) => sum + item.quantity * 200, 0);

      // Calcular dimensões (simulado)
      const dimensions = {
        height: 5, // cm
        width: 20, // cm
        length: 30, // cm
      };

      // CEP de origem (configurável - pode vir de settings)
      const originZipCode = '01310100'; // Exemplo: São Paulo (sem hífen)

      const response = await shippingAPI.calculate({
        originZipCode,
        destinationZipCode: destinationZipCode.replace(/\D/g, ''),
        weight: totalWeight,
        dimensions,
        value: totalPrice,
      });

      setShippingOptions(response.options || []);
      
      // Selecionar primeira opção automaticamente
      if (response.options && response.options.length > 0) {
        setSelectedShipping(response.options[0]);
      }
    } catch (error: any) {
      console.error('Error calculating shipping:', error);
      toast.error('Erro ao calcular frete', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    } finally {
      setLoadingShipping(false);
    }
  };

  // Atualizar endereço selecionado (v2.0)
  const handleAddressChange = (addressId: number | null) => {
    if (addressId === null) {
      // Novo endereço - atualizar estado primeiro
      setIsNewAddress(true);
      setSelectedAddressId(null);
      
      // Limpar campos do formulário ou manter valores atuais
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user?.name || '',
        email: prev.email || user?.email || '',
        phone: prev.phone || '',
        address: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
      }));
    } else {
      // Endereço salvo - atualizar estado primeiro
      setIsNewAddress(false);
      setSelectedAddressId(addressId);
      
      const address = userAddresses.find((addr) => addr.id === addressId);
      if (address) {
        setFormData(prev => ({
          ...prev,
          fullName: address.recipientName || user?.name || '',
          phone: address.phone || '',
          address: `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''}`,
          neighborhood: address.neighborhood || '',
          city: address.city,
          state: address.state,
          zipCode: address.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2'),
        }));

        // Calcular frete automaticamente
        calculateShipping(address.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2'));
      }
    }
  };

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

    // Validar campos obrigatórios se estiver criando novo endereço
    if (isNewAddress) {
      const requiredFields = {
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
            const addressParts = formData.address.split(',').map(part => part.trim()).filter(part => part.length > 0);
            const addressData = {
              label: 'Endereço Principal',
              street: addressParts[0] || formData.address, // Primeira parte ou endereço completo
              number: addressParts[1] || 'S/N', // Segunda parte ou 'S/N'
              complement: addressParts[2] || '', // Terceira parte (complemento) ou vazio
              neighborhood: addressParts[3] || '', // Quarta parte (bairro) ou vazio
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
      const paymentData: any = {
        gateway: 'mercadopago', // Integrado com Mercado Pago
        paymentMethod: selectedPaymentMethod,
        installments: selectedPaymentMethod === 'credit_card' ? installments : 1,
        amount: finalTotal,
      };

      if (selectedPaymentMethod === 'credit_card') {
        // Validar se o número do cartão foi preenchido
        if (!formData.cardNumber || formData.cardNumber.trim().length < 4) {
          toast.error('Número do cartão inválido', {
            description: 'Por favor, preencha o número do cartão corretamente.',
          });
          setIsProcessing(false);
          return;
        }
        // Extrair últimos 4 dígitos (remover espaços e caracteres não numéricos)
        const cardDigits = formData.cardNumber.replace(/\D/g, '');
        paymentData.cardLastDigits = cardDigits.slice(-4);
        // Aqui você poderia adicionar validação de bandeira do cartão
      }

      // Criar registro de pagamento
      const payment = await paymentsAPI.create(order.id, paymentData);

      // Processar pagamento com Mercado Pago (Checkout Pro)
      try {
        const processResult = await paymentsAPI.process(payment.id);
        
        console.log('Process result:', processResult);
        console.log('Payment object:', processResult.payment);
        console.log('init_point:', processResult.payment?.init_point);
        console.log('sandbox_init_point:', processResult.payment?.sandbox_init_point);
        
        // Tentar diferentes formas de acessar a URL
        const checkoutUrl = 
          processResult.payment?.sandbox_init_point || 
          processResult.payment?.init_point ||
          processResult.sandbox_init_point ||
          processResult.init_point;
        
        if (checkoutUrl) {
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

          // Redirecionar para o Mercado Pago
          console.log('Redirecionando para:', checkoutUrl);
          window.location.href = checkoutUrl;
          return;
        } else {
          console.error('Nenhuma URL de checkout encontrada:', {
            processResult,
            payment: processResult.payment,
          });
          throw new Error('URL de checkout não retornada pelo Mercado Pago');
        }
      } catch (paymentError: any) {
        console.error('Error processing payment:', paymentError);
        const errorMessage = paymentError.response?.data?.error || paymentError.message || 'Não foi possível redirecionar para o pagamento. Tente novamente.';
        console.error('Payment error details:', {
          status: paymentError.response?.status,
          data: paymentError.response?.data,
          message: errorMessage,
        });
        toast.error('Erro ao processar pagamento', {
          description: errorMessage,
        });
        setIsProcessing(false);
        return;
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error('Erro ao criar pedido', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
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

              {/* Seleção de Endereços Salvos (v2.0) */}
              {userAddresses.length > 0 && (
                <div className="mb-6 space-y-3">
                  <Label className="text-base font-semibold">Endereços Salvos</Label>
                  <RadioGroup
                    value={isNewAddress ? 'new' : (selectedAddressId ? selectedAddressId.toString() : '')}
                    onValueChange={(value) => {
                      // Forçar atualização do estado
                      if (value === 'new') {
                        setIsNewAddress(true);
                        setSelectedAddressId(null);
                        handleAddressChange(null);
                      } else if (value && value !== '') {
                        const addressId = parseInt(value);
                        if (!isNaN(addressId) && addressId > 0) {
                          setIsNewAddress(false);
                          setSelectedAddressId(addressId);
                          handleAddressChange(addressId);
                        }
                      }
                    }}
                  >
                    {userAddresses.map((address) => (
                      <div
                        key={address.id}
                        className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedAddressId === address.id && !isNewAddress
                            ? 'border-sky-500 bg-sky-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <RadioGroupItem 
                          value={address.id.toString()} 
                          id={`address-${address.id}`} 
                          className="mt-1"
                        />
                        <label
                          htmlFor={`address-${address.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">
                                  {address.label || 'Endereço'} {address.isDefault && (
                                    <span className="ml-2 px-2 py-0.5 text-xs bg-sky-100 text-sky-700 rounded">
                                      Padrão
                                    </span>
                                  )}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {address.street}, {address.number}
                                {address.complement && ` - ${address.complement}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {address.neighborhood}, {address.city} - {address.state}
                              </p>
                              <p className="text-sm text-gray-500">CEP: {address.zipCode.replace(/(\d{5})(\d{3})/, '$1-$2')}</p>
                              {address.recipientName && (
                                <p className="text-xs text-gray-500 mt-1">Destinatário: {address.recipientName}</p>
                              )}
                            </div>
                            {selectedAddressId === address.id && !isNewAddress && (
                              <Check className="h-5 w-5 text-sky-500" />
                            )}
                          </div>
                        </label>
                      </div>
                    ))}
                    
                    {/* Opção para novo endereço */}
                    <div
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        isNewAddress
                          ? 'border-sky-500 bg-sky-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem 
                        value="new" 
                        id="address-new" 
                        className="mt-1"
                      />
                      <label 
                        htmlFor="address-new" 
                        className="flex-1 cursor-pointer flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Usar novo endereço</span>
                        {isNewAddress && <Check className="h-5 w-5 text-sky-500 ml-auto" />}
                      </label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Formulário de Endereço */}
              <div className="space-y-4">
                {userAddresses.length === 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 Você ainda não tem endereços salvos. Preencha o formulário abaixo para criar seu primeiro endereço.
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="mt-2"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Endereço (Rua/Logradouro) *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="mt-2"
                    placeholder="Rua, Avenida, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleInputChange}
                    required
                    className="mt-2"
                    placeholder="Bairro"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado (UF) *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="mt-2"
                      maxLength={2}
                      placeholder="SP"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">CEP *</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                        placeholder="00000-000"
                        maxLength={9}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const cepDigits = formData.zipCode.replace(/\D/g, '');
                            if (cepDigits.length === 8) {
                              searchCEP(formData.zipCode);
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => searchCEP(formData.zipCode)}
                        disabled={loadingCEP || formData.zipCode.replace(/\D/g, '').length !== 8}
                        className="px-3 sm:px-4"
                        variant="outline"
                        title="Buscar endereço pelo CEP"
                      >
                        {loadingCEP ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {loadingShipping && (
                      <p className="text-xs text-gray-500 mt-1">Calculando frete...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="rounded-2xl bg-white p-6 shadow-md">
              <h2 className="mb-6 text-sky-500" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                Informações de Pagamento
              </h2>

              <div className="space-y-6">
                {/* Seleção de Método de Pagamento */}
                <PaymentMethodSelector
                  selectedMethod={selectedPaymentMethod}
                  onMethodChange={setSelectedPaymentMethod}
                  installments={installments}
                  onInstallmentsChange={setInstallments}
                />

                {/* Campos de cartão (apenas se cartão de crédito selecionado) */}
                {selectedPaymentMethod === 'credit_card' && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div>
                      <Label htmlFor="cardNumber">Número do Cartão</Label>
                      <Input
                        id="cardNumber"
                        name="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        required
                        className="mt-2"
                        maxLength={19}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="cardExpiry">Validade</Label>
                        <Input
                          id="cardExpiry"
                          name="cardExpiry"
                          placeholder="MM/YY"
                          value={formData.cardExpiry}
                          onChange={handleInputChange}
                          required
                          className="mt-2"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardCvc">CVC</Label>
                        <Input
                          id="cardCvc"
                          name="cardCvc"
                          placeholder="123"
                          value={formData.cardCvc}
                          onChange={handleInputChange}
                          required
                          className="mt-2"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Mensagens informativas para PIX e Boleto */}
                {selectedPaymentMethod === 'pix' && (
                  <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                    <p className="text-sm text-blue-800">
                      💡 Você receberá o código PIX após confirmar o pedido. O pagamento é processado instantaneamente.
                    </p>
                  </div>
                )}

                {selectedPaymentMethod === 'boleto' && (
                  <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      💡 Você receberá o boleto após confirmar o pedido. O pedido será processado após a confirmação do pagamento.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-4 lg:h-fit">
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <h2 className="mb-6 text-sky-500" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                Resumo do Pedido
              </h2>

              <div className="mb-4 space-y-3">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex justify-between text-gray-600" style={{ fontSize: '0.875rem' }}>
                    <span>
                      {item.product.name} x {item.quantity}
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      R$ {(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Coupon Input */}
              <CouponInput
                subtotal={totalPrice}
                onCouponApplied={setAppliedCoupon}
                onCouponRemoved={() => setAppliedCoupon(null)}
                appliedCoupon={appliedCoupon}
              />

              <Separator className="my-4" />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span style={{ fontWeight: 600 }}>R$ {totalPrice.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto ({appliedCoupon.code})</span>
                    <span style={{ fontWeight: 600 }}>- R$ {appliedCoupon.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {/* Opções de frete (v2.0) */}
                {loadingShipping ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frete</span>
                    <span className="text-sm text-gray-500">Calculando...</span>
                  </div>
                ) : shippingOptions.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-gray-600">Opções de entrega</Label>
                    {shippingOptions.map((option: any) => (
                      <div
                        key={option.service}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedShipping?.service === option.service
                            ? 'border-sky-500 bg-sky-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedShipping(option)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{option.service}</p>
                            <p className="text-xs text-gray-600">
                              {option.name || `Prazo estimado: ${option.estimatedDays} dia${option.estimatedDays !== 1 ? 's' : ''} útil${option.estimatedDays !== 1 ? 'is' : ''}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">R$ {option.price.toFixed(2)}</span>
                            <input
                              type="radio"
                              checked={selectedShipping?.service === option.service}
                              onChange={() => setSelectedShipping(option)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : formData.zipCode.length === 9 ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frete</span>
                    <span className="text-sm text-gray-500">Informe o CEP para calcular</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frete</span>
                    <span style={{ fontWeight: 600 }}>A calcular</span>
                  </div>
                )}
                <Separator />
                {selectedShipping && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frete ({selectedShipping.service})</span>
                    <span className="font-medium">R$ {selectedShipping.price.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Total</span>
                  <span className="text-sky-500" style={{ fontSize: '1.5rem', fontWeight: 900 }}>
                    R$ {((appliedCoupon ? appliedCoupon.finalTotal : totalPrice) + (selectedShipping?.price || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isProcessing}
                className="mt-6 w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 py-6 text-white shadow-lg hover:from-amber-500 hover:to-orange-600 disabled:opacity-50"
                style={{ fontWeight: 700, fontSize: '1.1rem' }}
              >
                {isProcessing ? 'Processando...' : 'Finalizar Pedido'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Package, Clock, Truck, CheckCircle, XCircle, CreditCard, Wallet, QrCode, Search, Filter, X, Star, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, Link } from 'wouter';
import { ordersAPI, reviewsAPI } from '../lib/api';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { OrderItem } from '../types';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { toast } from 'sonner';

const statusConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  pending: {
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Pendente',
  },
  processing: {
    icon: Package,
    color: 'bg-blue-100 text-blue-800',
    label: 'Processando',
  },
  shipped: {
    icon: Truck,
    color: 'bg-purple-100 text-purple-800',
    label: 'Enviado',
  },
  delivered: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800',
    label: 'Entregue',
  },
  cancelled: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    label: 'Cancelado',
  },
};

export function OrdersPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para filtros e busca
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  
  // Estados para modal de avaliação
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string; image: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const loadOrders = async () => {
      // Esperar o AuthContext terminar de carregar antes de verificar autenticação
      if (authLoading) {
        return;
      }
      
      if (!isAuthenticated) {
        setLocation('/login');
        return;
      }

      try {
        setLoading(true);
        const ordersData = await ordersAPI.getAll();
        setOrders(ordersData);
      } catch (error) {
        console.error('Error loading orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [isAuthenticated, authLoading, setLocation]);

  // Filtrar pedidos baseado nos filtros e busca
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    
    return orders.filter((order) => {
      // Filtro de busca
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = order.id.toString().includes(query);
        const matchesProducts = order.items?.some((item: OrderItem) => 
          item.product?.name?.toLowerCase().includes(query) ||
          item.productName?.toLowerCase().includes(query)
        ) || false;
        const matchesTotal = order.total.toString().includes(query);
        
        if (!matchesId && !matchesProducts && !matchesTotal) {
          return false;
        }
      }
      
      // Filtro por status
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }
      
      // Filtro por forma de pagamento
      if (paymentMethodFilter !== 'all') {
        const hasPaymentMethod = order.payments?.some((payment: any) => 
          payment.paymentMethod === paymentMethodFilter
        ) || order.paymentMethod === paymentMethodFilter;
        
        if (!hasPaymentMethod) {
          return false;
        }
      }
      
      return true;
    });
  }, [orders, searchQuery, statusFilter, paymentMethodFilter]);

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (statusFilter !== 'all') count++;
    if (paymentMethodFilter !== 'all') count++;
    return count;
  }, [searchQuery, statusFilter, paymentMethodFilter]);

  // Limpar todos os filtros
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPaymentMethodFilter('all');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-8 text-sky-500" style={{ fontSize: '2.5rem', fontWeight: 900 }}>
        Meus Pedidos
      </h1>

      {/* Barra de Pesquisa e Filtros */}
      <div className="mb-6 space-y-4">
        {/* Barra de Pesquisa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por número do pedido, produto ou valor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4">
          {/* Filtro por Status */}
          <div className="flex-1 min-w-[200px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Forma de Pagamento */}
          <div className="flex-1 min-w-[200px]">
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas as formas de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as formas de pagamento</SelectItem>
                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botão Limpar Filtros */}
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Limpar Filtros ({activeFiltersCount})
            </Button>
          )}
        </div>

        {/* Contador de resultados */}
        {!loading && (
          <div className="text-sm text-gray-600">
            {filteredOrders.length === 0 ? (
              <span>Nenhum pedido encontrado</span>
            ) : filteredOrders.length === orders.length ? (
              <span>Mostrando todos os {orders.length} pedido(s)</span>
            ) : (
              <span>
                Mostrando {filteredOrders.length} de {orders.length} pedido(s)
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-16 text-center shadow-lg">
          <p className="text-gray-600">Carregando pedidos...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-3xl bg-white p-16 text-center shadow-lg">
          {orders.length === 0 ? (
            <>
              <Package className="mx-auto mb-6 h-24 w-24 text-gray-300" />
              <h2 className="mb-4 text-gray-700" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                Nenhum Pedido Ainda
              </h2>
              <p className="text-gray-600">
                Você ainda não fez nenhum pedido
              </p>
            </>
          ) : (
            <>
              <Search className="mx-auto mb-6 h-24 w-24 text-gray-300" />
              <h2 className="mb-4 text-gray-700" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                Nenhum Pedido Encontrado
              </h2>
              <p className="text-gray-600 mb-4">
                Não encontramos pedidos que correspondam aos filtros selecionados
              </p>
              {activeFiltersCount > 0 && (
                <Button onClick={clearFilters} variant="outline">
                  Limpar Filtros
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <div key={order.id} className="rounded-2xl bg-white p-6 shadow-md">
                {/* Order Header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                      Pedido #{order.id}
                    </h3>
                    <p className="text-gray-600" style={{ fontSize: '0.875rem' }}>
                      Feito em {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <Badge className={status.color}>
                    <StatusIcon className="mr-1 h-4 w-4" />
                    {status.label}
                  </Badge>
                </div>

                {/* Order Items */}
                <div className="space-y-4">
                  {order.items?.map((item: OrderItem, index: number) => {
                    const productPrice = typeof item.product.price === 'number' 
                      ? item.product.price 
                      : Number(item.product.price || item.price || 0);
                    
                    return (
                      <div key={index} className="flex gap-4">
                        <Link href={`/product/${item.product.id}`} className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-orange-50 cursor-pointer hover:opacity-90 transition-opacity">
                          <ImageWithFallback
                            src={item.product.image}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        </Link>

                        <div className="flex flex-1 flex-col justify-between">
                          <Link href={`/product/${item.product.id}`} className="flex flex-1 justify-between cursor-pointer hover:opacity-80 transition-opacity">
                            <div className="flex-1">
                              <h4 style={{ fontWeight: 600 }}>
                                {item.product.name}
                              </h4>
                              <p className="text-gray-600" style={{ fontSize: '0.875rem' }}>
                                Tamanho: {item.size} • Cor: {item.color} • Qtd: {item.quantity}
                              </p>
                            </div>

                            <div className="text-right">
                              <p style={{ fontWeight: 700 }}>
                                R$ {(productPrice * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </Link>

                          {/* Botão de Avaliar Produto - apenas para pedidos entregues */}
                          {order.status === 'delivered' && item.product?.id && (
                            <div className="mt-3">
                              <Button
                                onClick={() => {
                                  setSelectedProduct({
                                    id: item.product.id,
                                    name: item.product.name,
                                    image: item.product.image,
                                  });
                                  setReviewRating(5);
                                  setReviewComment('');
                                  setReviewImages([]);
                                  setIsReviewDialogOpen(true);
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white border-0"
                              >
                                <Star className="mr-2 h-4 w-4" />
                                Avaliar Produto
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Payment Information */}
                {(order.payments && order.payments.length > 0) || order.paymentMethod ? (
                  <div className="mt-6 border-t pt-4">
                    <h4 className="mb-3 text-sm font-semibold text-gray-700">Forma de Pagamento</h4>
                    <div className="space-y-2">
                      {order.payments && order.payments.length > 0 ? (
                        order.payments.map((payment: any, index: number) => {
                          const paymentMethodLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
                            credit_card: { label: 'Cartão de Crédito', icon: CreditCard },
                            debit_card: { label: 'Cartão de Débito', icon: Wallet },
                            pix: { label: 'PIX', icon: QrCode },
                            boleto: { label: 'Boleto', icon: Package },
                          };
                          
                          const paymentInfo = paymentMethodLabels[payment.paymentMethod] || {
                            label: payment.paymentMethod || 'Não informado',
                            icon: CreditCard,
                          };
                          const PaymentIcon = paymentInfo.icon;
                          
                          const paymentStatusLabels: Record<string, { label: string; color: string }> = {
                            pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
                            processing: { label: 'Processando', color: 'bg-blue-100 text-blue-800' },
                            approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
                            rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
                            refunded: { label: 'Reembolsado', color: 'bg-gray-100 text-gray-800' },
                          };
                          
                          const statusInfo = paymentStatusLabels[payment.status] || {
                            label: payment.status || 'Desconhecido',
                            color: 'bg-gray-100 text-gray-800',
                          };
                          
                          return (
                            <div key={payment.id || index} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${paymentInfo.label === 'PIX' ? 'bg-green-100 text-green-700' : paymentInfo.label.includes('Crédito') ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                  <PaymentIcon className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {paymentInfo.label}
                                    {payment.installments && payment.installments > 1 && (
                                      <span className="ml-2 text-gray-600">
                                        ({payment.installments}x)
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    R$ {Number(payment.amount).toFixed(2).replace('.', ',')}
                                  </p>
                                </div>
                              </div>
                              <Badge className={statusInfo.color}>
                                {statusInfo.label}
                              </Badge>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                          <CreditCard className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {order.paymentMethod === 'credit_card' ? 'Cartão de Crédito' :
                               order.paymentMethod === 'debit_card' ? 'Cartão de Débito' :
                               order.paymentMethod === 'pix' ? 'PIX' :
                               order.paymentMethod || 'Não informado'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Order Total */}
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-between">
                    <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>Total</span>
                    <span className="text-sky-500" style={{ fontSize: '1.25rem', fontWeight: 900 }}>
                      R$ {Number(order.total).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Avaliação */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Avaliar {selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Compartilhe sua opinião sobre este produto que você recebeu
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              {/* Preview do Produto */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                  <ImageWithFallback
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">{selectedProduct.name}</h4>
                  <p className="text-sm text-gray-600">Produto entregue - Você pode avaliar com estrelas, texto e fotos</p>
                </div>
              </div>

              {/* Avaliação com Estrelas */}
              <div>
                <Label className="mb-2 block">Avaliação com Estrelas *</Label>
                <p className="mb-3 text-sm text-gray-500">
                  Selecione quantas estrelas este produto merece
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewRating(rating)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          rating <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comentário */}
              <div>
                <Label htmlFor="review-comment" className="mb-2 block">
                  Comentário (Opcional)
                </Label>
                <p className="mb-2 text-xs text-green-600">
                  ✓ Você comprou este produto e pode escrever um comentário
                </p>
                <Textarea
                  id="review-comment"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Compartilhe sua opinião sobre este produto..."
                  rows={4}
                  className="text-sm sm:text-base"
                />
              </div>

              {/* Upload de Fotos */}
              <div>
                <Label className="mb-2 block">
                  Fotos do Produto (Opcional)
                </Label>
                <p className="mb-2 text-xs text-gray-500">
                  Adicione fotos do produto que você recebeu (máximo 5 fotos)
                </p>
                
                {/* Preview das imagens */}
                {reviewImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {reviewImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = [...reviewImages];
                            newImages.splice(index, 1);
                            setReviewImages(newImages);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Botão de upload */}
                {reviewImages.length < 5 && (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Clique para upload</span> ou arraste e solte
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG até 2MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple={false}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Validar tamanho (2MB)
                          if (file.size > 2 * 1024 * 1024) {
                            toast.error('A imagem deve ter no máximo 2MB');
                            return;
                          }
                          
                          // Validar tipo
                          if (!file.type.startsWith('image/')) {
                            toast.error('Por favor, selecione um arquivo de imagem válido');
                            return;
                          }
                          
                          // Processar imagem mantendo alta qualidade
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const img = new Image();
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              let width = img.width;
                              let height = img.height;
                              
                              // Limitar tamanho máximo para manter qualidade mas reduzir tamanho do arquivo
                              const maxDimension = 1920; // Máximo de 1920px mantendo qualidade
                              
                              if (width > maxDimension || height > maxDimension) {
                                if (width > height) {
                                  height = (height * maxDimension) / width;
                                  width = maxDimension;
                                } else {
                                  width = (width * maxDimension) / height;
                                  height = maxDimension;
                                }
                              }
                              
                              canvas.width = width;
                              canvas.height = height;
                              
                              const ctx = canvas.getContext('2d');
                              if (!ctx) {
                                toast.error('Erro ao processar a imagem');
                                return;
                              }
                              
                              // Configurações de alta qualidade
                              ctx.imageSmoothingEnabled = true;
                              ctx.imageSmoothingQuality = 'high';
                              
                              // Desenhar imagem no canvas
                              ctx.drawImage(img, 0, 0, width, height);
                              
                              // Converter para base64 com alta qualidade (0.95 = 95% de qualidade)
                              let base64 = canvas.toDataURL('image/jpeg', 0.95);
                              
                              // Verificar se o base64 foi gerado corretamente
                              if (!base64 || base64.length < 100) {
                                toast.error('Erro ao processar a imagem. Tente novamente.');
                                return;
                              }
                              
                              // Verificar tamanho do base64 (MySQL TEXT pode ter até 65KB, mas vamos usar LONGTEXT que suporta até 4GB)
                              // Mas para evitar problemas, vamos garantir que não seja muito grande
                              const base64SizeInMB = (base64.length * 3) / 4 / 1024 / 1024;
                              
                              console.log('✅ Imagem processada:', {
                                tamanhoOriginal: file.size,
                                tamanhoBase64: base64.length,
                                tamanhoBase64MB: base64SizeInMB.toFixed(2),
                                dimensoes: `${width}x${height}`,
                                startsWithData: base64.startsWith('data:image'),
                                preview: base64.substring(0, 50),
                              });
                              
                              // Se o base64 for muito grande (>2MB), reduzir qualidade
                              if (base64SizeInMB > 2) {
                                console.warn('⚠️ Base64 muito grande, reduzindo qualidade...');
                                base64 = canvas.toDataURL('image/jpeg', 0.85);
                                const newSize = (base64.length * 3) / 4 / 1024 / 1024;
                                console.log('📉 Nova qualidade:', {
                                  tamanhoBase64: base64.length,
                                  tamanhoBase64MB: newSize.toFixed(2),
                                });
                              }
                              
                              if (reviewImages.length < 5) {
                                setReviewImages([...reviewImages, base64]);
                              } else {
                                toast.error('Máximo de 5 fotos por avaliação');
                              }
                            };
                            img.onerror = () => {
                              toast.error('Erro ao carregar a imagem');
                            };
                            img.src = reader.result as string;
                          };
                          reader.onerror = () => {
                            toast.error('Erro ao ler o arquivo');
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Botão de Enviar */}
              <Button
                onClick={async () => {
                  if (!selectedProduct) return;

                  try {
                    setSubmittingReview(true);
                    const productId = Number(selectedProduct.id);
                    
                    console.log('📤 Enviando avaliação:', {
                      productId,
                      productIdType: typeof productId,
                      productName: selectedProduct.name,
                      hasComment: !!(reviewComment.trim()),
                      hasImages: reviewImages.length > 0,
                      rating: reviewRating,
                    });
                    
                    // Enviar avaliação (pedido entregue = sempre permite comentário e fotos)
                    await reviewsAPI.create(
                      productId,
                      reviewRating,
                      reviewComment.trim() || undefined,
                      reviewImages.length > 0 ? reviewImages : undefined
                    );
                    
                    toast.success('Avaliação enviada com sucesso!');
                    setIsReviewDialogOpen(false);
                    setReviewComment('');
                    setReviewImages([]);
                    setReviewRating(5);
                    setSelectedProduct(null);
                    
                    // Recarregar pedidos para atualizar
                    const ordersData = await ordersAPI.getAll();
                    setOrders(ordersData);
                  } catch (error: any) {
                    console.error('Error submitting review:', error);
                    toast.error(error.response?.data?.error || error.message || 'Erro ao enviar avaliação');
                  } finally {
                    setSubmittingReview(false);
                  }
                }}
                disabled={submittingReview}
                className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white"
              >
                {submittingReview ? 'Enviando...' : 'Enviar Avaliação'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

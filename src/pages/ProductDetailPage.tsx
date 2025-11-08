import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, Minus, Plus, ShoppingCart, Star, Heart } from 'lucide-react';
import { productsAPI, reviewsAPI, stockAPI, wishlistAPI } from '../lib/api';
import { Product } from '../lib/mockData';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { AnalyticsEvents } from '../lib/analytics';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

interface Review {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export function ProductDetailPage() {
  const [, params] = useRoute('/product/:id');
  const [, setLocation] = useLocation();
  const { addToCart } = useCart();
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState({ averageRating: 0, totalReviews: 0 });
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  
  // Novo estado para variações (v2.0)
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [loadingVariants, setLoadingVariants] = useState(true);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const productId = Number(params?.id);
        // Validar se o ID é um número válido e positivo
        if (!productId || isNaN(productId) || productId <= 0) {
          setProduct(null);
          setLoading(false);
          return;
        }
        const data = await productsAPI.getById(productId);
          setProduct(data);
          
          // Rastrear visualização de produto
          AnalyticsEvents.viewProduct(
            data.id.toString(),
            data.name,
            data.category?.name,
            data.price
          );
          
          // Verificar se produto está na wishlist
          if (isAuthenticated) {
            try {
              const checkResponse = await wishlistAPI.check(productId);
              setIsInWishlist(checkResponse.isInWishlist || false);
            } catch (error) {
              console.error('Error checking wishlist:', error);
            }
            
            // Verificar se usuário comprou o produto
            try {
              setCheckingPurchase(true);
              const purchaseCheck = await reviewsAPI.checkPurchase(productId);
              setHasPurchased(purchaseCheck.hasPurchased || false);
            } catch (error) {
              console.error('Error checking purchase:', error);
              setHasPurchased(false);
            } finally {
              setCheckingPurchase(false);
            }
          }
          
          // Carregar variações do produto (v2.0)
          try {
            setLoadingVariants(true);
            const variantsData = await stockAPI.getVariantsByProduct(productId);
            setVariants(variantsData);
            
            // Extrair tamanhos e cores disponíveis das variações
            const sizesSet = new Set<string>();
            const colorsSet = new Set<string>();
            
            variantsData.forEach((variant: any) => {
              if (variant.size) sizesSet.add(variant.size);
              if (variant.color) colorsSet.add(variant.color);
            });
            
            const uniqueSizes = Array.from(sizesSet);
            const uniqueColors = Array.from(colorsSet);
            
            setAvailableSizes(uniqueSizes);
            setAvailableColors(uniqueColors);
            
            // Selecionar primeira variação disponível
            if (uniqueSizes.length > 0) {
              setSelectedSize(uniqueSizes[0]);
            }
            if (uniqueColors.length > 0) {
              setSelectedColor(uniqueColors[0]);
            }
            
            // Fallback: usar sizes e colors do produto se não houver variações
            if (variantsData.length === 0) {
              if (data.sizes && data.sizes.length > 0) {
                setSelectedSize(data.sizes[0]);
              }
              if (data.colors && data.colors.length > 0) {
                setSelectedColor(data.colors[0]);
              }
            }
          } catch (error) {
            console.error('Error loading variants:', error);
            // Fallback para sistema antigo se variações não existirem
            if (data.sizes && data.sizes.length > 0) {
              setSelectedSize(data.sizes[0]);
            }
            if (data.colors && data.colors.length > 0) {
              setSelectedColor(data.colors[0]);
            }
          } finally {
            setLoadingVariants(false);
          }
      } catch (error) {
        console.error('Error loading product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [params?.id, isAuthenticated]);

  // Atualizar variação selecionada quando tamanho ou cor mudarem
  useEffect(() => {
    if (variants.length > 0 && selectedSize && selectedColor) {
      const variant = variants.find(
        (v) => v.size === selectedSize && v.color === selectedColor
      );
      setSelectedVariant(variant || null);
      
      // Ajustar quantidade máxima baseada no estoque disponível
      if (variant) {
        const availableStock = variant.stock - variant.reservedStock;
        if (quantity > availableStock) {
          setQuantity(Math.max(1, availableStock));
        }
      }
      
      // Verificar se variação está na wishlist
      if (isAuthenticated && variant) {
        wishlistAPI.check(Number(params?.id), variant.id).then((response) => {
          setIsInWishlist(response.isInWishlist || false);
        }).catch(() => {});
      }
    } else {
      setSelectedVariant(null);
    }
  }, [selectedSize, selectedColor, variants, quantity, isAuthenticated, params?.id]);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoadingReviews(true);
        const productId = Number(params?.id);
        // Validar se o ID é um número válido e positivo
        if (!productId || isNaN(productId) || productId <= 0) {
          setLoadingReviews(false);
          return;
        }
        const [reviewsData, ratingData] = await Promise.all([
          reviewsAPI.getByProduct(productId),
          reviewsAPI.getAverageRating(productId),
        ]);
        setReviews(reviewsData);
        setAverageRating(ratingData);
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };

    if (params?.id) {
      loadReviews();
    }
  }, [params?.id]);

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast.error('Você precisa estar logado para avaliar um produto');
      setLocation('/login');
      return;
    }

    // Se houver comentário, verificar se usuário comprou
    if (reviewComment.trim() && !hasPurchased) {
      toast.error('Você precisa comprar o produto antes de escrever um comentário. Você pode avaliar apenas com estrelas.');
      return;
    }

    try {
      setSubmittingReview(true);
      const productId = Number(params?.id);
      
      // Validar se o ID é um número válido e positivo
      if (!productId || isNaN(productId) || productId <= 0) {
        toast.error('ID do produto inválido');
        setSubmittingReview(false);
        return;
      }
      
      // Enviar avaliação (rating obrigatório, comment opcional)
      await reviewsAPI.create(
        productId, 
        reviewRating, 
        hasPurchased ? reviewComment : undefined
      );
      
      // Reload reviews
      const [reviewsData, ratingData] = await Promise.all([
        reviewsAPI.getByProduct(productId),
        reviewsAPI.getAverageRating(productId),
      ]);
      setReviews(reviewsData);
      setAverageRating(ratingData);
      
      setReviewComment('');
      setReviewRating(5);
      setIsReviewDialogOpen(false);
      toast.success(
        hasPurchased && reviewComment.trim()
          ? 'Avaliação e comentário enviados com sucesso!'
          : 'Avaliação enviada com sucesso!'
      );
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.error || error.message || 'Erro ao enviar avaliação');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <p className="text-gray-600">Carregando produto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <h1 className="mb-4 text-sky-500" style={{ fontSize: '2rem', fontWeight: 900 }}>
          Produto Não Encontrado
        </h1>
        <Button onClick={() => setLocation('/shop')}>
          Voltar para a Loja
        </Button>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = async () => {
    if (!product) return;
    
    // Validar se tamanho e cor foram selecionados (se o produto tiver essas opções)
    const hasSizes = product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0;
    const hasColors = product.colors && Array.isArray(product.colors) && product.colors.length > 0;
    
    if (hasSizes && !selectedSize) {
      toast.error('Selecione um tamanho', {
        description: 'Por favor, escolha um tamanho antes de adicionar ao carrinho.',
      });
      return;
    }
    
    if (hasColors && !selectedColor) {
      toast.error('Selecione uma cor', {
        description: 'Por favor, escolha uma cor antes de adicionar ao carrinho.',
      });
      return;
    }
    
    // Usar valores padrão se não houver seleção
    const size = selectedSize || (hasSizes ? product.sizes[0] : 'Único');
    const color = selectedColor || (hasColors ? product.colors[0] : 'Padrão');
    
    // Validar estoque usando variação (v2.0)
    if (selectedVariant) {
      const availableStock = selectedVariant.stock - selectedVariant.reservedStock;
      
      if (availableStock < quantity) {
        toast.error('Estoque insuficiente', {
          description: `Apenas ${availableStock} unidades disponíveis para esta variação.`,
        });
        return;
      }
      
      if (availableStock === 0) {
        toast.error('Produto fora de estoque', {
          description: 'Esta variação está sem estoque disponível.',
        });
        return;
      }
    } else {
      // Fallback para sistema antigo (sem variações)
      if (product.stock < quantity) {
        toast.error('Estoque insuficiente', {
          description: `Apenas ${product.stock} unidades disponíveis.`,
        });
        return;
      }
      
      if (product.stock === 0) {
        toast.error('Produto fora de estoque');
        return;
      }
    }
    
    addToCart(product, quantity, size, color);
    
    // Rastrear adição ao carrinho
    AnalyticsEvents.addToCart(
      product.id.toString(),
      product.name,
      quantity,
      product.price
    );
    
    toast.success('Adicionado ao carrinho!', {
      description: `${quantity}x ${product.name} adicionado ao seu carrinho.`,
    });
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Você precisa estar logado para adicionar à wishlist');
      setLocation('/login');
      return;
    }

    if (!product) return;

    try {
      setWishlistLoading(true);
      
      if (isInWishlist) {
        // Remover da wishlist - precisamos buscar o item primeiro
        toast.error('Funcionalidade de remoção em desenvolvimento');
      } else {
        // Adicionar à wishlist
        await wishlistAPI.add({
          productId: product.id,
          variantId: selectedVariant?.id,
        });
        setIsInWishlist(true);
        
        // Rastrear adição à wishlist
        AnalyticsEvents.addToWishlist(
          product.id.toString(),
          product.name
        );
        
        toast.success('Adicionado à lista de desejos!', {
          description: 'Você pode ver seus favoritos em /wishlist',
        });
      }
    } catch (error: any) {
      console.error('Error toggling wishlist:', error);
      if (error.message?.includes('já está na wishlist')) {
        setIsInWishlist(true);
        toast.info('Produto já está na sua wishlist');
      } else {
        toast.error(error.message || 'Erro ao adicionar à wishlist');
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-4 sm:py-8 lg:py-12">
      <Button
        variant="ghost"
        onClick={() => setLocation('/shop')}
          className="mb-4 sm:mb-6 lg:mb-8 text-sky-500 hover:bg-sky-50 transition-colors text-sm sm:text-base"
      >
        <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
        Voltar para a Loja
      </Button>

      <div className="grid gap-4 sm:gap-6 lg:gap-12 lg:grid-cols-2">
        {/* Product Images */}
        <div className="relative space-y-2 sm:space-y-4">
          {/* Main Image */}
          <div className="relative overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl bg-gradient-to-br from-gray-50 via-blue-50 to-orange-50 shadow-lg sm:shadow-xl border border-gray-200 transition-colors">
            <div className="aspect-square w-full">
              <ImageWithFallback
                src={
                  (product as any).images && (product as any).images.length > 0
                    ? (product as any).images[selectedImageIndex]?.url || product.image
                    : product.image
                }
                alt={product.name}
                className="h-full w-full object-cover transition-opacity duration-300"
              />
            </div>

            {/* Badges */}
            <div className="absolute left-2 sm:left-3 lg:left-4 top-2 sm:top-3 lg:top-4 flex flex-col gap-1 sm:gap-2 z-10">
              {product.featured && (
                <Badge className="bg-gradient-to-r from-amber-400 to-amber-500 text-white border-0 shadow-md sm:shadow-lg text-[10px] sm:text-xs font-bold py-0.5 sm:py-1 px-1.5 sm:px-2">
                  <Star className="mr-0.5 sm:mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3 fill-white" />
                  Destaque
                </Badge>
              )}
              {discount > 0 && (
                <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-md sm:shadow-lg text-[10px] sm:text-xs font-bold py-0.5 sm:py-1 px-1.5 sm:px-2">
                  -{discount}% OFF
                </Badge>
              )}
            </div>
          </div>

          {/* Thumbnail Gallery */}
          {(product as any).images && (product as any).images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-1.5 sm:gap-2">
              {(product as any).images.slice(0, 8).map((img: any, index: number) => (
                <button
                  key={img.id || index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                    selectedImageIndex === index
                      ? 'border-sky-500 ring-2 ring-sky-200 scale-105'
                      : 'border-gray-200 hover:border-sky-300 hover:scale-105'
                  }`}
                >
                  <ImageWithFallback
                    src={img.url}
                    alt={`${product.name} - Imagem ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {img.isPrimary && (
                    <div className="absolute top-1 right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-md">
                      <Star className="h-2.5 w-2.5 fill-white" />
                    </div>
                  )}
                  {/* Overlay quando selecionado */}
                  {selectedImageIndex === index && (
                    <div className="absolute inset-0 bg-sky-500/10 pointer-events-none" />
                  )}
                </button>
              ))}
              {/* Mostrar mais imagens se houver */}
              {(product as any).images.length > 8 && (
                <button
                  onClick={() => setSelectedImageIndex(8)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                    selectedImageIndex >= 8
                      ? 'border-sky-500 ring-2 ring-sky-200'
                      : 'border-gray-200 hover:border-sky-300'
                  }`}
                >
                  <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">
                      +{(product as any).images.length - 8}
                    </span>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div>
            <Badge variant="outline" className="mb-2 sm:mb-3 lg:mb-4 border-sky-400 text-sky-600 bg-sky-50 text-[10px] sm:text-xs font-medium py-1 sm:py-1.5 px-2 sm:px-3">
              {typeof product.category === 'object' ? product.category.name : product.category}
            </Badge>
            <h1 className="mb-2 sm:mb-3 lg:mb-4 text-gray-900 text-xl sm:text-2xl lg:text-[2rem] font-bold sm:font-extrabold lg:font-black leading-tight sm:leading-snug" style={{ fontWeight: 900, lineHeight: 1.2 }}>
              {product.name}
            </h1>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)', lineHeight: 1.7 }}>
              {product.description}
            </p>
          </div>

          {/* Price */}
          <div className="flex flex-col gap-1.5 sm:gap-2 pb-3 sm:pb-4 border-b border-gray-200">
            {discount > 0 && product.originalPrice && (
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <Badge className="bg-red-500 text-white text-[10px] sm:text-xs font-bold py-0.5 sm:py-1 px-1.5 sm:px-2">
                  {discount}% OFF
                </Badge>
                <span className="text-gray-400 line-through text-sm sm:text-base lg:text-lg">
                  R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-sky-600 text-2xl sm:text-3xl lg:text-[2.5rem] font-extrabold lg:font-black">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              ou até 10x de <span className="font-semibold text-gray-700">R$ {(product.price / 10).toFixed(2).replace('.', ',')}</span> sem juros
            </p>
          </div>

          {/* Size Selection */}
          <div className="pt-2 sm:pt-3 border-t border-gray-200">
            <Label className="mb-2 sm:mb-3 block text-sm sm:text-base font-semibold text-gray-900">Selecionar Tamanho</Label>
            <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {(availableSizes.length > 0 ? availableSizes : (Array.isArray(product.sizes) ? product.sizes : [])).map((size, index) => {
                  // Verificar se há estoque disponível para este tamanho com a cor selecionada
                  const variantForSize = variants.find(
                    (v) => v.size === size && v.color === selectedColor
                  );
                  const hasStock = variantForSize 
                    ? (variantForSize.stock - variantForSize.reservedStock) > 0
                    : true;
                  
                  return (
                    <div key={`${product.id}-size-${index}-${size}`}>
                      <RadioGroupItem
                        value={size}
                        id={`size-${size}`}
                        className="peer sr-only"
                        disabled={!hasStock}
                      />
                      <Label
                        htmlFor={`size-${size}`}
                        className={`flex cursor-pointer items-center justify-center rounded-md sm:rounded-lg border-2 px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 lg:py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                          !hasStock
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : selectedSize === size
                            ? 'border-sky-500 bg-sky-500 text-white shadow-md'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-sky-400 hover:bg-sky-50'
                        }`}
                      >
                        {size}
                        {!hasStock && ' (Indisponível)'}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Color Selection */}
          <div className="pt-2 sm:pt-3 border-t border-gray-200">
            <Label className="mb-2 sm:mb-3 block text-sm sm:text-base font-semibold text-gray-900">Selecionar Cor</Label>
            <RadioGroup value={selectedColor} onValueChange={setSelectedColor}>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {(availableColors.length > 0 ? availableColors : (Array.isArray(product.colors) ? product.colors : [])).map((color, index) => {
                  // Verificar se há estoque disponível para esta cor com o tamanho selecionado
                  const variantForColor = variants.find(
                    (v) => v.color === color && v.size === selectedSize
                  );
                  const hasStock = variantForColor
                    ? (variantForColor.stock - variantForColor.reservedStock) > 0
                    : true;
                  
                  return (
                    <div key={`${product.id}-color-${index}-${color}`}>
                      <RadioGroupItem
                        value={color}
                        id={`color-${color}`}
                        className="peer sr-only"
                        disabled={!hasStock}
                      />
                      <Label
                        htmlFor={`color-${color}`}
                        className={`flex cursor-pointer items-center justify-center rounded-md sm:rounded-lg border-2 px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 lg:py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                          !hasStock
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : selectedColor === color
                            ? 'border-sky-500 bg-sky-500 text-white shadow-md'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-sky-400 hover:bg-sky-50'
                        }`}
                      >
                        {color}
                        {!hasStock && ' (Indisponível)'}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Quantity */}
          <div className="pt-2 sm:pt-3 border-t border-gray-200">
            <Label className="mb-2 sm:mb-3 block text-sm sm:text-base font-semibold text-gray-900">Quantidade</Label>
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 rounded-md sm:rounded-lg border-2 border-gray-300 hover:border-sky-500 transition-colors"
              >
                <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <span className="text-lg sm:text-xl font-bold text-gray-900 min-w-[2.5rem] sm:min-w-[3rem] text-center">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const maxStock = selectedVariant
                    ? selectedVariant.stock - selectedVariant.reservedStock
                    : product.stock;
                  setQuantity(Math.min(maxStock, quantity + 1));
                }}
                className="h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 rounded-md sm:rounded-lg border-2 border-gray-300 hover:border-sky-500 transition-colors disabled:opacity-50"
                disabled={
                  selectedVariant
                    ? quantity >= (selectedVariant.stock - selectedVariant.reservedStock)
                    : quantity >= product.stock
                }
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>

          {/* Stock Info (v2.0 - usando variação) */}
          {selectedVariant ? (
            <>
              {selectedVariant.stock - selectedVariant.reservedStock <= selectedVariant.minStock && selectedVariant.stock - selectedVariant.reservedStock > 0 && (
                <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 sm:p-4">
                  <p className="text-orange-600 font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full animate-pulse"></span>
                    Apenas {selectedVariant.stock - selectedVariant.reservedStock} unidades disponíveis!
                  </p>
                </div>
              )}
              {selectedVariant.stock - selectedVariant.reservedStock === 0 && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 sm:p-4">
                  <p className="text-red-600 font-semibold text-sm sm:text-base">
                    Esta variação está sem estoque disponível.
                  </p>
                </div>
              )}
            </>
          ) : (
            product.stock < 10 && product.stock > 0 && (
              <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 sm:p-4">
                <p className="text-orange-600 font-semibold flex items-center gap-2 text-sm sm:text-base">
                  <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full animate-pulse"></span>
                  Apenas {product.stock} em estoque!
                </p>
              </div>
            )
          )}

          {/* Add to Cart and Wishlist Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-gray-200">
            <Button
              onClick={handleAddToCart}
              size="lg"
              className="flex-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 sm:py-5 lg:py-6 text-white shadow-lg hover:from-amber-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl text-sm sm:text-base lg:text-lg"
              style={{ fontWeight: 700 }}
              disabled={
                selectedVariant
                  ? (selectedVariant.stock - selectedVariant.reservedStock) === 0
                  : product.stock === 0
              }
            >
              <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              {selectedVariant && (selectedVariant.stock - selectedVariant.reservedStock) === 0
                ? 'Fora de Estoque'
                : 'Adicionar ao Carrinho'}
            </Button>
            <Button
              onClick={handleToggleWishlist}
              size="lg"
              variant="outline"
              className="rounded-lg sm:rounded-xl border-2 border-sky-500 px-4 sm:px-5 lg:px-6 py-4 sm:py-5 lg:py-6 text-sky-500 hover:bg-sky-50 disabled:opacity-50 transition-all duration-200 hover:shadow-md"
              style={{ fontWeight: 700 }}
              disabled={wishlistLoading}
            >
              <Heart
                className={`h-4 w-4 sm:h-5 sm:w-5 transition-all ${isInWishlist ? 'fill-red-500 text-red-500 scale-110' : ''}`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Detailed Description Section */}
      {(product as any).detailedDescription && (
        <div className="mt-6 sm:mt-8 lg:mt-12 space-y-3 sm:space-y-4 border-t border-gray-200 pt-6 sm:pt-8 lg:pt-12">
          <h2 className="text-gray-900 text-lg sm:text-xl lg:text-[1.5rem] font-bold sm:font-extrabold lg:font-black" style={{ fontWeight: 700 }}>
            Descrição Detalhada
          </h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)', lineHeight: 1.7 }}>
              {(product as any).detailedDescription}
            </p>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="mt-6 sm:mt-8 lg:mt-12 space-y-4 sm:space-y-6 border-t border-gray-200 pt-6 sm:pt-8 lg:pt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="mb-2 sm:mb-3 text-gray-900 text-xl sm:text-2xl lg:text-[1.75rem] font-bold sm:font-extrabold lg:font-black" style={{ fontWeight: 900 }}>
              Avaliações e Comentários
            </h2>
            {averageRating.totalReviews > 0 && (
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                        i < Math.round(averageRating.averageRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-700 font-semibold text-sm sm:text-base">
                  {averageRating.averageRating.toFixed(1)} ({averageRating.totalReviews}{' '}
                  {averageRating.totalReviews === 1 ? 'avaliação' : 'avaliações'})
                </span>
              </div>
            )}
          </div>
          {isAuthenticated && (
            <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full bg-sky-500 text-white hover:bg-sky-600 text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4">
                  <Star className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Avaliar Produto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Avaliar {product.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Avaliação com Estrelas *</Label>
                    <p className="mb-3 text-sm text-gray-500">
                      Todos podem avaliar o produto com estrelas
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
                            className={`h-6 w-6 sm:h-8 sm:w-8 transition-colors ${
                              rating <= reviewRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {hasPurchased ? (
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
                  ) : (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-amber-700">
                        <span className="font-semibold">Apenas quem comprou pode comentar:</span> Você pode avaliar este produto com estrelas, mas para escrever um comentário é necessário ter comprado o produto.
                      </p>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submittingReview || checkingPurchase}
                    className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white"
                  >
                    {submittingReview ? 'Enviando...' : checkingPurchase ? 'Verificando...' : 'Enviar Avaliação'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loadingReviews ? (
          <div className="text-center py-6 sm:py-8">
            <p className="text-gray-600 text-sm sm:text-base">Carregando avaliações...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-lg sm:rounded-xl lg:rounded-2xl bg-gray-50 p-6 sm:p-8 lg:p-12 text-center border border-gray-200 transition-colors">
            <Star className="mx-auto mb-3 sm:mb-4 h-12 w-12 sm:h-16 sm:w-16 text-gray-300" />
            <p className="text-gray-600 text-sm sm:text-base">Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-lg sm:rounded-xl lg:rounded-2xl bg-white p-4 sm:p-5 lg:p-6 shadow-md border border-gray-200 transition-colors">
                <div className="mb-2 sm:mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{review.user.name}</p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                          i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

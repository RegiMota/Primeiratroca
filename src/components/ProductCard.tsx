import { ShoppingCart, Star, Heart, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../lib/mockData';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { wishlistAPI } from '../lib/api';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { useState, useEffect } from 'react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  useEffect(() => {
    if (isAuthenticated) {
      wishlistAPI.check(product.id)
        .then((response) => {
          setIsInWishlist(response.isInWishlist || false);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, product.id]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Verificar se o produto tem tamanhos e cores disponíveis
    const size = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Único';
    const color = product.colors && product.colors.length > 0 ? product.colors[0] : 'Padrão';
    
    addToCart(product, 1, size, color);
    toast.success('Adicionado ao carrinho!', {
      description: `${product.name} foi adicionado ao seu carrinho.`,
    });
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Você precisa estar logado para adicionar à wishlist');
      setLocation('/login');
      return;
    }

    try {
      setWishlistLoading(true);
      
      if (isInWishlist) {
        toast.info('Remova da wishlist em /wishlist');
      } else {
        await wishlistAPI.add({
          productId: product.id,
        });
        setIsInWishlist(true);
        toast.success('Adicionado à lista de desejos!');
      }
    } catch (error: any) {
      console.error('Error toggling wishlist:', error);
      if (error.message?.includes('já está na wishlist')) {
        setIsInWishlist(true);
      } else {
        toast.error(error.message || 'Erro ao adicionar à wishlist');
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleCardClick = () => {
    setLocation(`/product/${product.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative cursor-pointer overflow-hidden rounded-lg sm:rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 w-full"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-orange-50">
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setIsImageModalOpen(true);
          }}
        />
        
        {/* Overlay gradient no hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute left-1 sm:left-1.5 md:left-3 top-1 sm:top-1.5 md:top-3 flex flex-col gap-0.5 sm:gap-1 md:gap-2 z-10">
          {product.featured && (
            <Badge className="bg-gradient-to-r from-amber-400 to-amber-500 text-white border-0 shadow-md text-[9px] sm:text-[10px] md:text-xs font-bold py-0.5 px-1 sm:px-1.5 md:px-2.5">
              <Star className="mr-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 fill-white" />
              <span className="hidden sm:inline">Destaque</span>
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-md text-[9px] sm:text-[10px] md:text-xs font-bold py-0.5 px-1 sm:px-1.5 md:px-2.5">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Quick add buttons */}
        <div className="absolute bottom-1 sm:bottom-1.5 md:bottom-3 right-1 sm:right-1.5 md:right-3 flex gap-0.5 sm:gap-1 md:gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 translate-y-3 z-10">
          <Button
            size="icon"
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
            className="h-6 w-6 sm:h-7 sm:w-7 md:h-10 md:w-10 rounded-full bg-white/95 backdrop-blur-sm text-red-500 shadow-lg hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-95 border border-gray-200"
          >
            <Heart
              className={`h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 transition-all duration-200 ${isInWishlist ? 'fill-red-500 text-red-500 scale-110' : ''}`}
            />
          </Button>
          <Button
            size="icon"
            onClick={handleAddToCart}
            className="h-6 w-6 sm:h-7 sm:w-7 md:h-10 md:w-10 rounded-full bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-lg hover:from-sky-600 hover:to-sky-700 transition-all duration-200 hover:scale-110 active:scale-95 border-0"
          >
            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 transition-transform duration-200 group-hover:rotate-12" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-1 sm:p-1.5 md:p-4 space-y-0.5 sm:space-y-1 md:space-y-3">
        {/* Categoria/Marca */}
        <div>
          <Badge variant="outline" className="border-sky-400 text-sky-600 bg-sky-50 text-[9px] sm:text-[10px] md:text-xs font-medium py-0.5 px-0.5 sm:px-1 md:px-2">
            {typeof product.category === 'object' ? product.category.name : product.category}
          </Badge>
        </div>

        {/* Nome do Produto */}
        <h3 className="line-clamp-2 text-[10px] sm:text-[11px] md:text-sm font-bold text-gray-900 min-h-[1.5rem] sm:min-h-[1.75rem] md:min-h-[2.5rem] leading-tight sm:leading-snug group-hover:text-sky-600 transition-colors duration-200">
          {product.name}
        </h3>

        {/* Preço e Desconto */}
        <div className="space-y-0.5 sm:space-y-1">
          {discount > 0 && product.originalPrice && (
            <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 flex-wrap">
              <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-red-600 bg-red-50 px-1 sm:px-1.5 md:px-2 py-0.5 rounded">
                {discount}% OFF
              </span>
              <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 line-through">
                R$ {product.originalPrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
          )}
          <div className="flex items-baseline gap-0.5 sm:gap-1 md:gap-2">
            <span className="text-sm sm:text-base md:text-xl font-extrabold text-sky-600">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {/* Parcelamento */}
        <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 leading-tight sm:leading-relaxed">
          ou até 10x de <span className="font-semibold text-gray-700">R$ {(product.price / 10).toFixed(2).replace('.', ',')}</span> sem juros
        </p>

        {/* Tamanhos Disponíveis */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="flex flex-wrap gap-0.5 sm:gap-1 pt-0.5 sm:pt-1 border-t border-gray-100">
            {product.sizes.slice(0, 2).map((size, index) => (
              <span
                key={`${product.id}-size-${index}-${size}`}
                className="inline-flex items-center justify-center px-1 sm:px-1.5 md:px-2 py-0.5 text-[9px] sm:text-[10px] md:text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors"
              >
                {size}
              </span>
            ))}
            {product.sizes.length > 2 && (
              <span className="inline-flex items-center justify-center px-1 sm:px-1.5 md:px-2 py-0.5 text-[9px] sm:text-[10px] md:text-xs text-gray-500 font-medium">
                +{product.sizes.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Stock info */}
        {product.stock < 10 && (
          <div className="mt-0.5 sm:mt-1 md:mt-2 pt-0.5 sm:pt-1 md:pt-2 border-t border-orange-100">
            <p className="text-[9px] sm:text-[10px] md:text-xs font-bold text-orange-600 flex items-center gap-0.5 sm:gap-1">
              <span className="inline-block w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-orange-500 rounded-full animate-pulse"></span>
            Apenas {product.stock} em estoque!
          </p>
          </div>
        )}
      </div>

      {/* Modal para exibir imagem em tamanho real */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            overflow: 'auto',
          }}
          onClick={() => setIsImageModalOpen(false)}
        >
          {/* Botão fechar */}
          <button
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
            aria-label="Fechar"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Imagem */}
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              minHeight: '100vh',
              padding: '4rem 2rem',
              boxSizing: 'border-box',
            }}
          >
            <img
              src={product.image}
              alt={product.name}
              className="rounded-lg"
              style={{
                maxWidth: 'calc(100vw - 4rem)',
                maxHeight: 'calc(100vh - 8rem)',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                imageRendering: 'auto',
                display: 'block',
                margin: 'auto',
              }}
              onError={(e) => {
                console.error('❌ Erro ao carregar imagem no modal:', product.image);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                console.log('✅ Imagem carregada no modal:', {
                  naturalWidth: img.naturalWidth,
                  naturalHeight: img.naturalHeight,
                  displayWidth: img.offsetWidth,
                  displayHeight: img.offsetHeight,
                  containerWidth: img.parentElement?.offsetWidth,
                  containerHeight: img.parentElement?.offsetHeight,
                });
                img.style.display = 'block';
              }}
              loading="eager"
            />
          </div>
        </div>
      )}
    </div>
  );
}

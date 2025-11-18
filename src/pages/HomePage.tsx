import React, { useState, useEffect } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Hero } from '../components/Hero';
import { RulesBar } from '../components/RulesBar';
import { productsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { useLocation } from 'wouter';
import { 
  Send, RotateCw, CreditCard, Headphones, Star, 
  Award, Heart, Sparkles, Users, 
  ArrowRight, ShoppingBag
} from 'lucide-react';
import { Product } from '../lib/mockData';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../components/ui/carousel';

// Paleta Inovadora / Moderna (visual clean, contemporâneo — boa para marca jovem / streetwear)
const colors = {
  primaria: '#0F172A',      // Azul bem escuro / quase preto — base elegante
  secundaria: '#46D392',    // Verde-esmeralda — CTA e destaque (RGB: 70, 211, 146)
  acento: '#F97316',         // Laranja vibrante — promoções e badges
  neutraClara: '#F8FAFC',   // Off-white — fundos e cards
  neutraMedia: '#94A3B8',   // Azul-cinza — elementos secundários
};

// Seção de Benefícios
function BenefitsSection() {
  const benefits = [
    {
      icon: Send,
      title: 'Frete Grátis',
      description: 'Para compras acima de R$ 239',
      cardColor: '#FF6B35', // Laranja/Coral
      iconBg: '#FF6B35',
    },
    {
      icon: RotateCw,
      title: 'Troca Grátis',
      description: 'Na primeira compra',
      cardColor: '#FFD93D', // Amarelo
      iconBg: '#FFD93D',
    },
    {
      icon: CreditCard,
      title: 'Parcele sem juros',
      description: 'Em até 3x',
      cardColor: '#9B59B6', // Roxo
      iconBg: '#9B59B6',
    },
  ];

  return (
    <section style={{ backgroundColor: colors.neutraClara }} className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={index}
                className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ backgroundColor: benefit.cardColor }}
              >
                <CardContent className="p-5 md:p-6 flex flex-col items-start">
                  <div 
                    className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full text-white transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 
                    className="mb-1 text-base md:text-lg font-bold text-white"
                  >
                    {benefit.title}
                  </h3>
                  <p 
                    className="text-xs md:text-sm text-white/95 leading-tight"
                  >
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Seção de Categorias em Destaque
function FeaturedCategories() {
  const [, setLocation] = useLocation();

  const categories = [
    {
      name: 'Prematuro',
      image: 'https://kambai.cdn.magazord.com.br/img/2025/07/produto/7870/01-macacao-bebe-molecotton-mago-potter-kambai.png',
      href: '/shop?age=premature',
      buttonText: 'PREMATURO',
      color: 'blue',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
      borderColor: 'border-blue-500',
      shadowColor: 'shadow-blue-500/50',
    },
    {
      name: 'RN',
      image: 'https://kambai.cdn.magazord.com.br/img/2025/07/produto/7870/01-macacao-bebe-molecotton-mago-potter-kambai.png',
      href: '/shop?age=newborn',
      buttonText: 'RN',
      color: 'blue',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
      borderColor: 'border-blue-500',
      shadowColor: 'shadow-blue-500/50',
    },
    {
      name: 'Até 12 Meses',
      image: 'https://kambai.cdn.magazord.com.br/img/2025/07/produto/7870/01-macacao-bebe-molecotton-mago-potter-kambai.png',
      href: '/shop?age=baby',
      buttonText: 'Até 12 MESES',
      color: 'blue',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
      borderColor: 'border-blue-500',
      shadowColor: 'shadow-blue-500/50',
    },
  ];

  return (
    <section style={{ backgroundColor: colors.neutraClara }} className="py-12 md:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 text-center">
          <Badge 
            className="mb-3 text-white border-0 shadow-lg px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: colors.acento }}
          >
            <Sparkles className="mr-1.5 h-3 w-3" />
            Explore por Categoria
          </Badge>
          <h2 
            className="mb-3 text-2xl md:text-3xl lg:text-4xl font-extrabold"
            style={{ color: colors.primaria }}
          >
            Encontre o Perfeito para Seu Pequeno
          </h2>
          <p 
            className="mx-auto max-w-2xl text-base md:text-lg"
            style={{ color: colors.neutraMedia }}
          >
            Descubra nossa coleção cuidadosamente selecionada para cada fase da infância
          </p>
        </div>
        <div className="flex flex-row items-center justify-center gap-3 md:gap-4 lg:gap-5 flex-wrap">
          {categories.map((category, index) => (
            <div
              key={index}
              className="group flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95"
            >
              {/* Imagem circular com borda colorida */}
              <div 
                className="relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden shadow-lg border-2 transition-all duration-300 group-hover:shadow-xl"
                style={{
                  backgroundColor: colors.neutraClara,
                  borderColor: colors.secundaria,
                  boxShadow: `0 10px 15px -3px ${colors.neutraMedia}80, 0 4px 6px -2px ${colors.neutraMedia}40`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/400x400/f0f0f0/999999?text=' + encodeURIComponent(category.name);
                  }}
                />
                {/* Efeito de brilho circular */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
              
              {/* Botão retangular arredondado */}
              <Button
                onClick={() => setLocation(category.href)}
                className="text-white rounded-lg px-6 py-2.5 md:px-8 md:py-3 text-sm md:text-base font-bold shadow-md hover:shadow-lg transition-all duration-300 whitespace-nowrap transform group-hover:scale-105"
                style={{ backgroundColor: colors.secundaria }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.acento;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.secundaria;
                }}
              >
                {category.buttonText}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Seção de Novidades com Carrossel 3D Estilo Livros e Parallax
function NovidadesSection() {
  const [, setLocation] = useLocation();
  const [novidades, setNovidades] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(2); // Começar na terceira imagem (índice 2)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const sectionRef = React.useRef<HTMLElement>(null);

  // Cores de gradiente para cada "livro" (cicla se houver mais de 5 produtos)
  const bookGradients = [
    { from: '#46D392', to: '#3ABF7F' }, // Verde-esmeralda (RGB: 70, 211, 146)
    { from: '#F97316', to: '#EA580C' }, // Laranja
    { from: '#8B5CF6', to: '#7C3AED' }, // Roxo
    { from: '#EC4899', to: '#DB2777' }, // Rosa
    { from: '#10B981', to: '#059669' }, // Verde
  ];

  // Carregar produtos da categoria "Novidades"
  useEffect(() => {
    const loadNovidades = async () => {
      try {
        setLoading(true);
        // Buscar produtos da categoria "Novidades" - mínimo 4 produtos
        const response = await productsAPI.getAll({ category: 'Novidades', limit: 20 });
        const productsArray = Array.isArray(response) ? response : response.products || [];
        setNovidades(productsArray);
        // Ajustar índice inicial para a terceira imagem (índice 2), mas não exceder o tamanho do array
        if (productsArray.length > 2) {
          setCurrentIndex(2);
        } else if (productsArray.length > 0) {
          setCurrentIndex(0);
        }
      } catch (error) {
        console.error('Error loading novidades:', error);
        // Se não encontrar categoria "Novidades", buscar produtos recentes
        try {
          const recentResponse = await productsAPI.getAll({ limit: 20, sortBy: 'createdAt', sortOrder: 'desc' });
          const recentArray = Array.isArray(recentResponse) ? recentResponse : recentResponse.products || [];
          setNovidades(recentArray);
          // Ajustar índice inicial para a terceira imagem (índice 2), mas não exceder o tamanho do array
          if (recentArray.length > 2) {
            setCurrentIndex(2);
          } else if (recentArray.length > 0) {
            setCurrentIndex(0);
          }
        } catch (fallbackError) {
          console.error('Error loading fallback products:', fallbackError);
          setNovidades([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadNovidades();
  }, []);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < novidades.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, novidades.length]);

  // Efeito parallax com movimento do mouse (throttled para performance)
  useEffect(() => {
    let rafId: number | null = null;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return;
      
      rafId = requestAnimationFrame(() => {
        if (carouselRef.current) {
          const rect = carouselRef.current.getBoundingClientRect();
          setMouseX(e.clientX - rect.left - rect.width / 2);
          setMouseY(e.clientY - rect.top - rect.height / 2);
        }
        rafId = null;
      });
    };

    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('mousemove', handleMouseMove, { passive: true });
      return () => {
        carousel.removeEventListener('mousemove', handleMouseMove);
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  }, []);

  // Handlers para drag
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart(e.clientX);
    setDragOffset(0);
  };

  const handleMouseMoveDrag = (e: React.MouseEvent) => {
    if (isDragging) {
      const diff = e.clientX - dragStart;
      setDragOffset(diff);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      const threshold = 100;
      if (dragOffset > threshold && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (dragOffset < -threshold && currentIndex < novidades.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
      setIsDragging(false);
      setDragOffset(0);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      const diff = e.touches[0].clientX - dragStart;
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      const threshold = 100;
      if (dragOffset > threshold && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (dragOffset < -threshold && currentIndex < novidades.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
      setIsDragging(false);
      setDragOffset(0);
    }
  };

  const goToNext = () => {
    if (currentIndex < novidades.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <section 
        ref={sectionRef}
        className="py-16 md:py-20 lg:py-24 relative"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <Badge 
              className="mb-4 text-white border-0 shadow-lg px-4 py-1.5 text-sm font-semibold"
              style={{ backgroundColor: colors.acento }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Novidades
            </Badge>
            <h2 
              className="mb-4 text-3xl md:text-4xl lg:text-5xl font-extrabold"
              style={{ color: colors.primaria }}
            >
              A moda dos pequenos você encontra aqui
            </h2>
            <p 
              className="mx-auto max-w-2xl text-lg"
              style={{ color: colors.neutraMedia }}
            >
              Descubra as últimas tendências e novidades da nossa coleção
            </p>
          </div>
          <div className="flex justify-center items-center h-[600px]">
            <p style={{ color: colors.neutraMedia }}>Carregando novidades...</p>
          </div>
        </div>
      </section>
    );
  }

  if (novidades.length === 0) {
    return null;
  }

  return (
    <section 
      ref={sectionRef}
      className="py-16 md:py-20 lg:py-24 relative"
    >
      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-12 text-center relative" style={{ zIndex: 200, position: 'relative' }}>
          <Badge 
            className="mb-4 text-white border-0 shadow-lg px-4 py-1.5 text-sm font-semibold relative"
            style={{ backgroundColor: colors.acento, zIndex: 200 }}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Novidades
          </Badge>
          <h2 
            className="mb-4 text-3xl md:text-4xl lg:text-5xl font-extrabold relative"
            style={{ color: colors.primaria, zIndex: 200 }}
          >
            A moda dos pequenos você encontra aqui
          </h2>
          <p 
            className="mx-auto max-w-2xl text-lg relative"
            style={{ color: colors.neutraMedia, zIndex: 200, position: 'relative' }}
          >
            Descubra as últimas tendências e novidades da nossa coleção
          </p>
        </div>
        
        {/* Carrossel 3D Estilo Livros */}
        <div className="relative flex justify-center" style={{ minHeight: '600px', zIndex: 1 }}>
          <div 
          ref={carouselRef}
          className="relative h-[600px] md:h-[700px] flex items-center justify-center w-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMoveDrag}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ 
            perspective: '1000px',
            cursor: isDragging ? 'grabbing' : 'grab',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div 
            className="relative w-full h-full flex items-center justify-center"
            style={{
              transform: `translateX(${dragOffset}px)`,
              transition: isDragging ? 'none' : 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {novidades.map((product, index) => {
              // Obter imagem do produto
              const productImage = product.images && product.images.length > 0 
                ? product.images[0].url 
                : product.image || 'https://via.placeholder.com/400x400/f0f0f0/999999?text=Sem+Imagem';
              
              // Calcular posição e transformações 3D
              const distance = index - currentIndex;
              const absDistance = Math.abs(distance);
              
              // Transformações 3D baseadas na distância do card central
              // Ajustado para exibir no mínimo 4 produtos visíveis
              const baseTranslateX = distance * 300; // Espaçamento entre livros reduzido para mostrar mais produtos
              const translateZ = -absDistance * 80; // Profundidade 3D reduzida
              const rotateY = distance * 20; // Rotação em Y reduzida para mostrar mais produtos
              const scale = Math.max(0.6, 1 - absDistance * 0.1); // Escala baseada na distância (mínimo 0.6 para mostrar mais)
              const opacity = Math.max(0.5, 1 - absDistance * 0.15); // Opacidade baseada na distância (mínimo 0.5)
              
              // Efeito parallax com movimento do mouse (mais suave)
              const parallaxIntensity = Math.max(0, 1 - absDistance * 0.3);
              const parallaxX = mouseX * 0.015 * parallaxIntensity;
              const parallaxY = mouseY * 0.015 * parallaxIntensity;
              const translateX = baseTranslateX + parallaxX;
              
              // Z-index: card central tem maior valor
              const zIndex = novidades.length - absDistance;
              
              // Gradiente para o livro
              const gradient = bookGradients[index % bookGradients.length];
              
              // Determinar se é o card central
              const isCenter = index === currentIndex;
              
              return (
                <div
                  key={product.id}
                  className="absolute transition-all duration-700 ease-out"
                  style={{
                    width: '280px',
                    height: '500px',
                    transform: `
                      translateX(calc(-50% + ${translateX}px)) 
                      translateY(${parallaxY}px)
                      translateZ(${translateZ}px)
                      rotateY(${rotateY}deg)
                      scale(${scale})
                    `,
                    transformStyle: 'preserve-3d',
                    opacity: opacity,
                    zIndex: isCenter ? 5 : Math.max(1, Math.min(4, zIndex)),
                    pointerEvents: isCenter ? 'auto' : 'none',
                    position: 'absolute',
                    willChange: 'transform',
                    left: '50%',
                  }}
                >
                  {/* Card do livro */}
                  <div
                    onClick={() => isCenter && setLocation(`/product/${product.id}`)}
                    className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl cursor-pointer transition-all duration-300 hover:shadow-3xl"
                    style={{
                      transform: isCenter ? 'scale(1.05)' : 'scale(1)',
                      transition: 'transform 0.3s ease-out',
                      borderRadius: '24px',
                    }}
                  >
                    {/* Efeito de fundo para destacar a foto */}
                    <div 
                      className="absolute inset-0 rounded-3xl"
                      style={{
                        background: `linear-gradient(135deg, ${gradient.from}15 0%, ${gradient.to}10 50%, ${colors.neutraClara}05 100%)`,
                        borderRadius: '24px',
                        zIndex: 0,
                      }}
                    />
                    
                    {/* Imagem do produto original */}
                    <div className="relative h-full overflow-hidden rounded-3xl" style={{ borderRadius: '24px', zIndex: 1 }}>
                      <img
                        src={productImage}
                        alt={product.name}
                        className="h-full w-full object-cover object-center rounded-3xl"
                        style={{
                          transform: `scale(1.1) translateY(${parallaxY * 0.1}px)`,
                          transition: 'transform 0.3s ease-out',
                          borderRadius: '24px',
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/400x400/f0f0f0/999999?text=Sem+Imagem';
                        }}
                      />
                      
                      {/* Overlay sutil no fundo da imagem para destacar */}
                      <div 
                        className="absolute inset-0 rounded-3xl"
                        style={{
                          background: `linear-gradient(to bottom, transparent 0%, transparent 60%, rgba(0,0,0,0.1) 100%)`,
                          borderRadius: '24px',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                    
                    {/* Conteúdo do livro */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                      <h3 className="mb-1 text-xl md:text-2xl lg:text-3xl font-bold leading-tight">
                        {product.name}
                      </h3>
                      {typeof product.category === 'object' && product.category.name && (
                        <p className="mb-4 text-sm md:text-base text-white/70">
                          {product.category.name}
                        </p>
                      )}
                      
                      {/* Botões apenas no card central */}
                      {isCenter && (
                        <div className="flex flex-col gap-2 mt-6">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/product/${product.id}`);
                            }}
                            className="w-full text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 py-3"
                            style={{ backgroundColor: colors.acento }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.secundaria;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = colors.acento;
                            }}
                          >
                            VER PRODUTO
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/product/${product.id}`);
                            }}
                            variant="outline"
                            className="w-full text-white border-white/30 bg-white/10 hover:bg-white/20 font-semibold rounded-lg transition-all duration-300 py-2"
                          >
                            MAIS DETALHES
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Efeito de brilho ao passar o mouse (apenas no card central) */}
                    {isCenter && (
                      <div 
                        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 70%)`,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Botões de navegação - sempre visíveis */}
          {novidades.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                disabled={currentIndex === 0}
                className="absolute h-12 w-12 rounded-full backdrop-blur-sm border-2 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: `${colors.primaria}80`,
                  borderColor: colors.acento,
                  color: colors.neutraClara,
                  zIndex: 100,
                  position: 'absolute',
                  left: '-60px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
                aria-label="Anterior"
              >
                <ArrowRight className="h-6 w-6 rotate-180" />
              </button>
              
              <button
                onClick={goToNext}
                disabled={currentIndex >= novidades.length - 1}
                className="absolute h-12 w-12 rounded-full backdrop-blur-sm border-2 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: `${colors.primaria}80`,
                  borderColor: colors.acento,
                  color: colors.neutraClara,
                  zIndex: 100,
                  position: 'absolute',
                  right: '-60px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
                aria-label="Próximo"
              >
                <ArrowRight className="h-6 w-6" />
              </button>
            </>
          )}
          
          {/* Indicadores de página */}
          {novidades.length > 1 && (
            <div 
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2"
              style={{ zIndex: 100, position: 'absolute' }}
            >
              {novidades.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'w-8' 
                      : 'w-2 hover:w-4'
                  }`}
                  style={{
                    backgroundColor: index === currentIndex 
                      ? colors.acento 
                      : `${colors.neutraMedia}60`
                  }}
                  aria-label={`Ir para produto ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </section>
  );
}

// Seção de Produtos em Destaque
function FeaturedProducts() {
  const [, setLocation] = useLocation();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        // Carregar produtos em destaque
        const featuredResponse = await productsAPI.getAll({ featured: true });
        const featured = Array.isArray(featuredResponse) ? featuredResponse : featuredResponse.products || [];
        setFeaturedProducts(featured.slice(0, 8)); // Carregar mais para ter opções
        
        // Carregar produtos mais vendidos baseado em vendas reais
        const bestSelling = await productsAPI.getBestSelling(8);
        const bestSellingArray = Array.isArray(bestSelling) ? bestSelling : bestSelling.products || [];
        setBestSellingProducts(bestSellingArray); // Já vem limitado e ordenado
      } catch (error) {
        console.error('Error loading products:', error);
        // Em caso de erro, tentar carregar produtos sem filtros
        try {
          const allProducts = await productsAPI.getAll({ limit: 8 });
          const allProductsArray = Array.isArray(allProducts) ? allProducts : allProducts.products || [];
          setFeaturedProducts(allProductsArray);
          setBestSellingProducts(allProductsArray);
        } catch (fallbackError) {
          console.error('Error loading fallback products:', fallbackError);
        setFeaturedProducts([]);
          setBestSellingProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);


  return (
    <section style={{ backgroundColor: colors.neutraClara }} className="py-12 md:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 md:mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <Badge 
              className="mb-3 text-white border-0 shadow-lg px-3 py-1 text-sm font-semibold"
              style={{ backgroundColor: colors.acento }}
            >
              <Star className="mr-1.5 h-3.5 w-3.5 fill-white" />
              Mais Vendidos
            </Badge>
            <h2 
              className="mb-2 text-2xl md:text-3xl lg:text-4xl font-extrabold"
              style={{ color: colors.primaria }}
            >
              Produtos Mais Vendidos
            </h2>
            <p 
              className="text-sm md:text-base max-w-2xl"
              style={{ color: colors.neutraMedia }}
            >
              Confira nossa seleção especial das melhores roupas para os pequenos
            </p>
          </div>
          <Button
            onClick={() => setLocation('/shop')}
            className="text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2.5 font-semibold"
            style={{ backgroundColor: colors.secundaria }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.acento;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.secundaria;
            }}
          >
            Ver Todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {/* Linha de cima - Mais Vendidos */}
            <div className="flex flex-col items-center w-full mb-8 md:mb-12">
              <div className="mb-6 w-full text-center">
                
                <h3 
                  className="text-xl md:text-2xl lg:text-3xl font-extrabold"
                  style={{ color: colors.primaria }}
                >
                  Os Favoritos dos Nossos Clientes
                </h3>
              </div>
              <div className="w-full max-w-7xl mx-auto px-2 sm:px-4" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                {bestSellingProducts.length > 0 ? (
                  <Carousel
                    opts={{
                      align: 'start',
                      loop: bestSellingProducts.length > 4,
                      slidesToScroll: 'auto',
                    }}
                    className="w-full"
                    style={{ maxWidth: '100%' }}
                  >
                    <CarouselContent className="-ml-2 md:-ml-4 w-full" style={{ maxWidth: '100%' }}>
                      {bestSellingProducts.map((product) => (
                        <CarouselItem 
                          key={product.id} 
                          className="pl-2 md:pl-4 shrink-0 basis-1/2 sm:basis-1/3 md:basis-1/4" 
                          style={{ 
                            minWidth: '160px',
                            maxWidth: 'calc(50% - 8px)',
                            width: 'auto'
                          }}
                        >
                          <div className="w-full max-w-[220px] mx-auto">
                            <ProductCard product={product} />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {bestSellingProducts.length > 2 && (
                      <>
                        <CarouselPrevious className="left-1 sm:left-2 h-8 w-8 md:h-10 md:w-10 z-20" />
                        <CarouselNext className="right-1 sm:right-2 h-8 w-8 md:h-10 md:w-10 z-20" />
                      </>
                    )}
                  </Carousel>
                ) : (
                  <div 
                    className="text-center py-8 text-sm"
                    style={{ color: colors.neutraMedia }}
                  >
                    Nenhum produto mais vendido encontrado.
                  </div>
                )}
              </div>
            </div>

            {/* Divisória entre seções */}
            <div className="flex items-center justify-center py-8 md:py-12">
              <div className="relative w-full max-w-4xl">
                <div className="absolute inset-0 flex items-center">
                  <div 
                    className="w-full border-t-2"
                    style={{ borderColor: colors.neutraMedia }}
                  ></div>
                </div>
                <div className="relative flex justify-center">
                  <div style={{ backgroundColor: colors.neutraClara }} className="px-4">
                    <Heart 
                      className="h-6 w-6 animate-pulse" 
                      style={{ color: colors.acento }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Linha de baixo - Produtos em Destaque */}
            <div className="flex flex-col items-center w-full">
              <div className="mb-8 md:mb-12 w-full text-center">
                <Badge 
                  className="mb-3 text-white border-0 shadow-lg px-3 py-1 text-sm font-semibold"
                  style={{ backgroundColor: colors.acento }}
                >
                  <Star className="mr-1.5 h-3.5 w-3.5 fill-white" />
                  Destaques
                </Badge>
                <h3 
                  className="mb-2 text-xl md:text-2xl lg:text-3xl font-extrabold"
                  style={{ color: colors.primaria }}
                >
                  Produtos em Destaque
                </h3>
                <p 
                  className="text-sm md:text-base max-w-2xl mx-auto"
                  style={{ color: colors.neutraMedia }}
                >
                  Confira nossa seleção especial das melhores roupas para os pequenos
                </p>
              </div>
              <div className="w-full max-w-7xl mx-auto px-2 sm:px-4" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                {featuredProducts.length > 0 ? (
                  <Carousel
                    opts={{
                      align: 'start',
                      loop: featuredProducts.length > 4,
                      slidesToScroll: 'auto',
                    }}
                    className="w-full"
                    style={{ maxWidth: '100%' }}
                  >
                    <CarouselContent className="-ml-2 md:-ml-4 w-full" style={{ maxWidth: '100%' }}>
                      {featuredProducts.map((product) => (
                        <CarouselItem 
                          key={product.id} 
                          className="pl-2 md:pl-4 shrink-0 basis-1/2 sm:basis-1/3 md:basis-1/4" 
                          style={{ 
                            minWidth: '160px',
                            maxWidth: 'calc(50% - 8px)',
                            width: 'auto'
                          }}
                        >
                          <div className="w-full max-w-[220px] mx-auto">
                            <ProductCard product={product} />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {featuredProducts.length > 2 && (
                      <>
                        <CarouselPrevious className="left-1 sm:left-2 h-8 w-8 md:h-10 md:w-10 z-20" />
                        <CarouselNext className="right-1 sm:right-2 h-8 w-8 md:h-10 md:w-10 z-20" />
                      </>
                    )}
                  </Carousel>
                ) : (
                  <div 
                    className="text-center py-8 text-sm"
                    style={{ color: colors.neutraMedia }}
                  >
                    Nenhum produto em destaque encontrado.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// Seção de Depoimentos
function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Maria Silva',
      role: 'Mãe de 2 filhos',
      content: 'Produtos de excelente qualidade e atendimento impecável. Recomendo!',
      rating: 5,
      image: 'https://ui-avatars.com/api/?name=Maria+Silva&background=0ea5e9&color=fff',
      gradient: 'from-blue-400 to-cyan-400',
    },
    {
      name: 'João Santos',
      role: 'Pai',
      content: 'As roupas são lindas e muito confortáveis. Meus filhos adoram!',
      rating: 5,
      image: 'https://ui-avatars.com/api/?name=João+Santos&background=0ea5e9&color=fff',
      gradient: 'from-purple-400 to-pink-400',
    },
    {
      name: 'Ana Costa',
      role: 'Mãe',
      content: 'Frete rápido e embalagem perfeita. Já compro há meses e sempre estou satisfeita.',
      rating: 5,
      image: 'https://ui-avatars.com/api/?name=Ana+Costa&background=0ea5e9&color=fff',
      gradient: 'from-amber-400 to-orange-400',
    },
  ];

  return (
    <section style={{ backgroundColor: colors.neutraClara, zIndex: 1 }} className="py-20 md:py-24 lg:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 md:px-6" style={{ zIndex: 1 }}>
        <div className="mb-16 text-center relative" style={{ zIndex: 2 }}>
          <Badge 
            className="mb-4 text-white border-0 shadow-lg px-4 py-1.5 text-sm font-semibold"
            style={{ backgroundColor: colors.acento, zIndex: 2, position: 'relative' }}
          >
            <p></p>
            <Users className="mr-2 h-4 w-4" />
            O que nossos clientes dizem
          </Badge>
          <h2 
            className="mb-4 text-3xl md:text-4xl lg:text-5xl font-extrabold"
            style={{ color: colors.primaria, zIndex: 2, position: 'relative' }}
          >
            Depoimentos
          </h2>
          <p 
            className="mx-auto max-w-2xl text-lg"
            style={{ color: colors.neutraMedia, zIndex: 2, position: 'relative' }}
          >
            Veja o que nossos clientes estão falando sobre a gente
          </p>
        </div>
        <div className="grid gap-8 md:gap-10 md:grid-cols-3" style={{ zIndex: 1, position: 'relative' }}>
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              style={{ backgroundColor: colors.neutraClara }}
            >
              <CardContent className="p-8">
                <div className="mb-6 flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star 
                      key={i} 
                      className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" 
                      style={{ 
                        transitionDelay: `${i * 50}ms`,
                        fill: colors.acento,
                        color: colors.acento
                      }} 
                    />
                  ))}
                </div>
                <p 
                  className="mb-8 leading-relaxed text-lg italic"
                  style={{ color: colors.primaria }}
                >
                  "{testimonial.content}"
                </p>
                <div 
                  className="flex items-center gap-4 pt-4 border-t"
                  style={{ borderColor: colors.neutraMedia }}
                >
                  <div 
                    className="relative h-14 w-14 rounded-full p-0.5"
                    style={{ backgroundColor: colors.secundaria }}
                  >
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                      className="h-full w-full rounded-full object-cover"
                  />
                  </div>
                  <div>
                    <p 
                      className="font-bold text-lg"
                      style={{ color: colors.primaria }}
                    >
                      {testimonial.name}
                    </p>
                    <p 
                      className="text-sm"
                      style={{ color: colors.neutraMedia }}
                    >
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Seção de Estatísticas
function StatsSection() {
  const stats = [
    { value: '10k+', label: 'Clientes Satisfeitos', icon: Users, gradient: 'from-blue-400 to-cyan-400' },
    { value: '5k+', label: 'Produtos Disponíveis', icon: ShoppingBag, gradient: 'from-purple-400 to-pink-400' },
    { value: '98%', label: 'Avaliação Positiva', icon: Star, gradient: 'from-amber-400 to-orange-400' },
    { value: '24/7', label: 'Suporte Disponível', icon: Headphones, gradient: 'from-green-400 to-emerald-400' },
  ];

  return (
    <section 
      className="relative py-20 md:py-24 lg:py-28 overflow-hidden"
      style={{ backgroundColor: colors.primaria, zIndex: 1 }}
    >
    
      
      <div className="relative mx-auto max-w-7xl px-4 md:px-6" style={{ zIndex: 1 }}>
        <div className="mb-16 text-center">
          <Badge 
            className="mb-4 backdrop-blur-sm text-white border-0 shadow-lg px-4 py-1.5 text-sm font-semibold"
            style={{ backgroundColor: `${colors.neutraClara}33`, zIndex: 2, position: 'relative' }}
          >
            <Award className="mr-2 h-4 w-4" />
            Nossos Números
          </Badge>
          <h2 className="mb-4 text-3xl md:text-4xl lg:text-5xl font-extrabold text-white" style={{ zIndex: 2, position: 'relative' }}>
            Confiança em Números
          </h2>
        </div>
        <div className="grid gap-10 md:gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index} 
                className="group text-center text-white transform transition-all duration-500 hover:scale-110"
                style={{ zIndex: 1, position: 'relative' }}
              >
                <div 
                  className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full shadow-2xl transition-all duration-500 group-hover:rotate-12 group-hover:shadow-3xl"
                  style={{ backgroundColor: colors.secundaria }}
                >
                  <Icon className="h-10 w-10 text-white" />
                </div>
                <div className="mb-4 text-5xl md:text-6xl font-extrabold drop-shadow-lg">
                  {stat.value}
                </div>
                <div className="text-lg md:text-xl font-semibold opacity-95">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <div style={{ maxWidth: '100vw', width: '100%', overflowX: 'hidden' }}>
      <Hero />
      <RulesBar />
      <FeaturedCategories />
      <FeaturedProducts />
      <NovidadesSection />
      
      {/* Divisória grande entre Mais Vendidos e Estatísticas */}
      <div style={{ backgroundColor: colors.neutraClara, zIndex: 1 }} className="py-12 md:py-16 transition-colors relative">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div 
                className="w-full border-t-2"
                style={{ borderColor: colors.acento }}
              ></div>
            </div>
            <div className="relative flex justify-center px-6" style={{ backgroundColor: colors.neutraClara, zIndex: 2 }}>
              
            </div>
          </div>
        </div>
      </div>
      
      <StatsSection />
      <TestimonialsSection />
    </div>
  );
}

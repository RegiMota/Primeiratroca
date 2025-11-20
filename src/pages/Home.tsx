import { Button } from "@/components/ui/button";
import { Star, Users, Package, Headphones, Send, RefreshCw, CreditCard, Truck, Shield, Heart, ChevronLeft, ChevronRight, Plane, ArrowLeftRight, Lock } from "lucide-react";
import { useState, useEffect, useRef, ReactNode } from "react";
import { useLocation } from "wouter";
import ImageCarousel from "@/components/ImageCarousel";
import { productsAPI, categoriesAPI, reviewsAPI, cartAPI, settingsAPI } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Product } from "@/lib/mockData";
import { toast } from "sonner";
import { ProductCard } from "@/components/ProductCard";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Review {
  id: number;
  rating: number;
  comment?: string;
  user: {
    name: string;
  };
  createdAt: string;
}

interface BenefitCard {
  id: number;
  iconName?: string | null;
  imageUrl?: string | null;
  mainText: string;
  subText: string;
  color?: string | null;
  link?: string | null;
  order: number;
  isActive: boolean;
}

// Mapeamento de ícones disponíveis
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Send,
  RefreshCw,
  CreditCard,
  Package,
  Truck,
  Shield,
  Heart,
  Star,
};

// Componente de card com animação de mouse
interface CardWithMouseAnimationProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

function CardWithMouseAnimation({ children, className, onClick }: CardWithMouseAnimationProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10; // Máximo de 10 graus
    const rotateY = ((x - centerX) / centerX) * 10; // Máximo de 10 graus

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transition: 'transform 0.1s ease-out',
      }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [benefitCards, setBenefitCards] = useState<BenefitCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBenefitCards, setLoadingBenefitCards] = useState(true);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [currentNewProductIndex, setCurrentNewProductIndex] = useState(0);
  const [isStatsVisible, setIsStatsVisible] = useState(false);
  const [isReviewsVisible, setIsReviewsVisible] = useState(false);

  // Buscar dados do backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
            // Buscar produtos em destaque (buscar mais para o carrossel)
            const productsResponse = await productsAPI.getAll({ featured: true, limit: 12 });
            const productsData = Array.isArray(productsResponse) ? productsResponse : (productsResponse.products || []);
            setFeaturedProducts(productsData);

            // Buscar produtos novos (novidades) - ordenados por data de criação
            const newProductsResponse = await productsAPI.getAll({ 
              sortBy: 'createdAt', 
              sortOrder: 'desc', 
              limit: 12 
            });
            const newProductsData = Array.isArray(newProductsResponse) ? newProductsResponse : (newProductsResponse.products || []);
            setNewProducts(newProductsData);

        // Buscar categorias
        const categoriesData = await categoriesAPI.getAll();
        setCategories(categoriesData);

        // Buscar benefit cards
        try {
          const cardsData = await settingsAPI.getBenefitCards();
          // Filtrar apenas cards ativos e ordenar
          const activeCards = cardsData
            .filter((card: BenefitCard) => card.isActive)
            .sort((a: BenefitCard, b: BenefitCard) => a.order - b.order);
          setBenefitCards(activeCards);
        } catch (error) {
          console.error('Error loading benefit cards:', error);
        } finally {
          setLoadingBenefitCards(false);
        }

        // Buscar reviews recentes (pegar reviews de alguns produtos)
        try {
          if (productsData.length > 0) {
            const productIds = productsData.slice(0, 3).map((p: Product) => p.id);
            const reviewsPromises = productIds.map((id: number) => 
              reviewsAPI.getByProduct(id).catch(() => ({ reviews: [] }))
            );
            const reviewsResults = await Promise.all(reviewsPromises);
            const allReviews = reviewsResults
              .flatMap((result: any) => result.reviews || [])
              .slice(0, 3);
            setReviews(allReviews);
          }
        } catch (error) {
          console.error('Error loading reviews:', error);
        }

        // Buscar carrinho se autenticado
        if (isAuthenticated) {
          try {
            await cartAPI.getCart();
          } catch (error) {
            // Ignorar erro se não houver carrinho
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erro ao carregar dados. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

        loadData();
      }, [isAuthenticated]);

      // Animação de entrada para os stats (repete ao rolar)
      useEffect(() => {
        const statsSection = document.getElementById('stats-section');
        if (!statsSection) return;

        const observer = new IntersectionObserver(
          (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setIsStatsVisible(true);
              } else {
                // Reset quando sair da viewport para repetir animação
                setIsStatsVisible(false);
              }
            });
          },
          { threshold: 0.1 }
        );

        observer.observe(statsSection);

        return () => {
          observer.unobserve(statsSection);
        };
      }, []);

      // Animação de entrada para os depoimentos (repete ao rolar)
      useEffect(() => {
        const reviewsSection = document.getElementById('reviews-section');
        if (!reviewsSection) return;

        const observer = new IntersectionObserver(
          (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setIsReviewsVisible(true);
              } else {
                // Reset quando sair da viewport para repetir animação
                setIsReviewsVisible(false);
              }
            });
          },
          { threshold: 0.1 }
        );

        observer.observe(reviewsSection);

        return () => {
          observer.unobserve(reviewsSection);
        };
      }, []);

  const handleCategoryClick = (categorySlug: string) => {
    setLocation(`/shop?category=${categorySlug}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 dia atrás';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
    return `${Math.floor(diffDays / 365)} anos atrás`;
  };

  return (
    <>

      {/* Banner Principal com Carrossel */}
      <ImageCarousel />

      {/* Estilos para efeito mágico */}
      <style>{`
        @keyframes magicPulse {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            filter: drop-shadow(0 0 10px rgba(70, 211, 146, 0.5));
          }
          25% {
            transform: scale(1.15) rotate(5deg);
            filter: drop-shadow(0 0 20px rgba(70, 211, 146, 0.8));
          }
          50% {
            transform: scale(1.2) rotate(-5deg);
            filter: drop-shadow(0 0 25px rgba(70, 211, 146, 1));
          }
          75% {
            transform: scale(1.15) rotate(3deg);
            filter: drop-shadow(0 0 20px rgba(70, 211, 146, 0.8));
          }
        }

        @keyframes magicGlow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(70, 211, 146, 0.3),
                        0 0 20px rgba(70, 211, 146, 0.2),
                        inset 0 0 10px rgba(70, 211, 146, 0.1);
          }
          50% {
            box-shadow: 0 0 20px rgba(70, 211, 146, 0.6),
                        0 0 40px rgba(70, 211, 146, 0.4),
                        0 0 60px rgba(70, 211, 146, 0.2),
                        inset 0 0 20px rgba(70, 211, 146, 0.2);
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
        }

        .magic-icon-container {
          position: relative;
          display: inline-block;
        }

        .magic-icon-container::before,
        .magic-icon-container::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 4px;
          height: 4px;
          background: #46d392;
          border-radius: 50%;
          opacity: 0;
          transform: translate(-50%, -50%);
        }

        .magic-icon-container::before {
          animation: sparkle 2s infinite;
          animation-delay: 0s;
          top: 20%;
          left: 20%;
        }

        .magic-icon-container::after {
          animation: sparkle 2s infinite;
          animation-delay: 1s;
          top: 80%;
          right: 20%;
          left: auto;
        }

        .magic-icon-container:hover {
          animation: magicPulse 0.6s ease-in-out;
        }

        .magic-icon-container:hover::before,
        .magic-icon-container:hover::after {
          animation: sparkle 0.5s ease-in-out;
        }

        .magic-icon {
          position: relative;
          z-index: 1;
          transition: all 0.3s ease;
        }

        .magic-icon-container:hover .magic-icon {
          animation: magicPulse 0.6s ease-in-out;
        }
      `}</style>

      {/* Faixa de Benefícios */}
      <section className="bg-gray-800 py-4 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 justify-items-center md:justify-items-start">
            {/* Site Confiável */}
            <div className="flex items-center gap-4 text-white justify-center md:justify-start w-full max-w-xs">
              <div className="magic-icon-container flex-shrink-0 cursor-pointer">
                <Lock className="magic-icon h-8 w-8 md:h-10 md:w-10" style={{ color: '#46d392' }} />
              </div>
              <div className="text-center md:text-left">
                <p className="font-semibold text-sm md:text-base">Site Confiável</p>
                <p className="text-xs md:text-sm text-gray-300">100% Seguro</p>
              </div>
            </div>

            {/* Troca Grátis */}
            <div className="flex items-center gap-4 text-white justify-center md:justify-start w-full max-w-xs">
              <div className="magic-icon-container flex-shrink-0 cursor-pointer">
                <ArrowLeftRight className="magic-icon h-8 w-8 md:h-10 md:w-10" style={{ color: '#46d392' }} />
              </div>
              <div className="text-center md:text-left">
                <p className="font-semibold text-sm md:text-base">Troca grátis</p>
                <p className="text-xs md:text-sm text-gray-300">Na primeira compra</p>
              </div>
            </div>

            {/* Parcele sem juros */}
            <div className="flex items-center gap-4 text-white justify-center md:justify-start w-full max-w-xs">
              <div className="magic-icon-container flex-shrink-0 cursor-pointer">
                <CreditCard className="magic-icon h-8 w-8 md:h-10 md:w-10" style={{ color: '#46d392' }} />
              </div>
              <div className="text-center md:text-left">
                <p className="font-semibold text-sm md:text-base">Parcele sem juros</p>
                <p className="text-xs md:text-sm text-gray-300">Em até 3x</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Guia do Enxoval - Benefit Cards */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-10 px-4">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">ESCOLHA SEU TAMANHO</h3>
            <p className="text-sm sm:text-base text-gray-600">Tudo que o seu bebê precisa, do RN ao 12 meses</p>
          </div>

          {loadingBenefitCards ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-items-center max-w-4xl mx-auto">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-6 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse w-full max-w-[200px]">
                  <div className="h-12 w-12 bg-gray-400 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-400 rounded w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : benefitCards.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 justify-items-center max-w-4xl mx-auto">
              {benefitCards.map((card) => {
                const IconComponent = card.iconName ? (iconMap[card.iconName] || Package) : null;
                // Cores padrão caso não tenha cor definida
                const defaultColors = [
                  "from-pink-300 to-pink-400",
                  "from-yellow-300 to-yellow-400",
                  "from-blue-300 to-blue-400",
                  "from-purple-300 to-purple-400"
                ];
                const colorIndex = card.order % defaultColors.length;
                
                return (
                  <CardWithMouseAnimation
                    key={card.id}
                    className={`rounded-2xl hover:shadow-xl transition-all duration-300 flex flex-col bg-white overflow-hidden ${
                      card.link ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => {
                      if (card.link) {
                        // Se o link começar com http:// ou https://, é um link externo
                        if (card.link.startsWith('http://') || card.link.startsWith('https://')) {
                          // @ts-ignore - window está disponível no browser
                          window.open(card.link, '_blank');
                        } else {
                          // Caso contrário, é um link interno
                          setLocation(card.link);
                        }
                      }
                    }}
                  >
                    {/* Área da imagem - ocupa 100% do card */}
                    <div className="w-full aspect-square overflow-hidden">
                      {card.imageUrl ? (
                        <img 
                          src={card.imageUrl} 
                          alt={card.mainText}
                          className="w-full h-full object-cover"
                        />
                      ) : IconComponent ? (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <div className="h-16 w-16 rounded-full bg-white/30 flex items-center justify-center">
                            <IconComponent className="h-10 w-10 text-gray-600" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gray-200"></div>
                      )}
                    </div>
                    
                    {/* Faixa colorida com texto */}
                    <div 
                      className={`p-3 text-center rounded-b-2xl ${
                        !card.color ? `bg-gradient-to-br ${defaultColors[colorIndex]}` : ''
                      }`}
                      style={card.color ? {
                        background: `linear-gradient(to bottom right, ${card.color}, ${card.color}dd)`,
                      } : {}}
                    >
                      <p className="font-semibold text-white text-sm mb-0.5 line-clamp-2">{card.mainText}</p>
                      <p className="text-white/90 text-xs line-clamp-2">{card.subText}</p>
                    </div>
                  </CardWithMouseAnimation>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-items-center max-w-4xl mx-auto">
              {[
                { name: "Acessórios", icon: "👕", color: "from-pink-300 to-pink-400" },
                { name: "Bodies e Macacões", icon: "🧸", color: "from-yellow-300 to-yellow-400" },
                { name: "Calçados", icon: "👶", color: "from-blue-300 to-blue-400" },
                { name: "Casacos e Agasalhos", icon: "🎁", color: "from-purple-300 to-purple-400" },
              ].map((category) => (
                <button
                  key={category.name}
                  onClick={() => setLocation('/shop')}
                  className={`p-6 rounded-lg bg-gradient-to-br ${category.color} hover:shadow-xl transition text-center transform hover:scale-105 w-full max-w-[200px]`}
                >
                  <div className="text-4xl mb-2">{category.icon}</div>
                  <p className="font-semibold text-gray-800 text-sm">{category.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Seção de Produtos em Destaque - Carrossel */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider bg-blue-100 px-4 py-1 rounded-full flex items-center gap-2 justify-center">
                <Star className="h-4 w-4 fill-blue-600 text-blue-600" />
                Destaque
              </span>
            </div>
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              Produtos em Destaque
            </h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Seleção especial das melhores roupas para o seu bebê
            </p>
          </div>

          <div className="flex justify-center mb-6">
            {/* Botão "Veja Todos" - Centralizado */}
            <Button
              onClick={() => setLocation('/shop')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl animate-pulse hover:animate-none relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-2">
                Veja Todos
                <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
              {/* Efeito de brilho animado */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md animate-pulse">
                  <div className="h-64 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-2/3 mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="relative">
              {/* Botão Anterior */}
              {featuredProducts.length > 3 && (
                <button
                  onClick={() => {
                    const maxIndex = Math.max(0, Math.ceil(featuredProducts.length / 3) - 1);
                    setCurrentProductIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-blue-500 text-white rounded-full p-2 shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110 border-2 border-white"
                  aria-label="Produtos anteriores"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              {/* Container do Carrossel */}
              <div className="overflow-hidden px-12 md:px-16">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{
                    transform: `translateX(-${currentProductIndex * 100}%)`
                  }}
                >
                  {Array.from({ length: Math.ceil(featuredProducts.length / 3) }).map((_, slideIndex) => (
                    <div key={slideIndex} className="flex-shrink-0 w-full flex gap-6">
                      {featuredProducts.slice(slideIndex * 3, slideIndex * 3 + 3).map((product) => (
                        <div key={product.id} className="flex-shrink-0 w-full md:w-1/3">
                          <ProductCard product={product} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão Próximo */}
              {featuredProducts.length > 3 && (
                <button
                  onClick={() => {
                    const maxIndex = Math.max(0, Math.ceil(featuredProducts.length / 3) - 1);
                    setCurrentProductIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-blue-500 text-white rounded-full p-2 shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110 border-2 border-white"
                  aria-label="Próximos produtos"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}

              {/* Indicadores (dots) */}
              {featuredProducts.length > 3 && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: Math.ceil(featuredProducts.length / 3) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentProductIndex(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentProductIndex
                          ? 'w-8 bg-blue-500 shadow-lg shadow-blue-500/50'
                          : 'w-2 bg-gray-300 hover:bg-blue-400'
                      }`}
                      aria-label={`Ir para slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Nenhum produto em destaque no momento.</p>
              <Button 
                onClick={() => setLocation('/shop')}
                className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                Ver Todos os Produtos
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Divisor entre seções */}
      <div className="py-8 px-4 bg-white">
        <div className="container mx-auto">
          <div className="flex items-center justify-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <div className="px-6">
              <p className="text-gray-500 text-sm font-medium">Descubra as últimas novidades</p>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Seção de Novidades - Carrossel com design completamente diferente */}
      <section className="py-16 px-4 bg-gradient-to-b from-white via-emerald-50/30 to-white relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-100 px-4 py-1 rounded-full">
                ✨ Lançamentos
              </span>
            </div>
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Novidades
            </h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Os lançamentos mais recentes para o seu bebê
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md animate-pulse">
                  <div className="h-64 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-2/3 mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : newProducts.length > 0 ? (
            <div className="relative">
              {/* Navegação lateral - Estilo completamente diferente */}
              {newProducts.length > 3 && (
                <>
                  <button
                    onClick={() => {
                      const maxIndex = Math.max(0, Math.ceil(newProducts.length / 3) - 1);
                      setCurrentNewProductIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm text-emerald-600 rounded-lg px-4 py-8 shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 hover:bg-white hover:scale-110 border-l-4 border-emerald-500"
                    aria-label="Produtos anteriores"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>
                  <button
                    onClick={() => {
                      const maxIndex = Math.max(0, Math.ceil(newProducts.length / 3) - 1);
                      setCurrentNewProductIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm text-emerald-600 rounded-lg px-4 py-8 shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 hover:bg-white hover:scale-110 border-r-4 border-emerald-500"
                    aria-label="Próximos produtos"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                </>
              )}

              {/* Container do Carrossel - Efeito 3D/Card Stack */}
              <div className="overflow-hidden px-8 md:px-20">
                <div 
                  className="flex transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{
                    transform: `translateX(calc(-${currentNewProductIndex * 100}% - ${currentNewProductIndex * 1.5}rem))`
                  }}
                >
                  {Array.from({ length: Math.ceil(newProducts.length / 3) }).map((_, slideIndex) => {
                    const isActive = slideIndex === currentNewProductIndex;
                    const distance = Math.abs(slideIndex - currentNewProductIndex);
                    return (
                      <div 
                        key={slideIndex} 
                        className="flex-shrink-0 w-full flex gap-8 transition-all duration-700"
                        style={{
                          transform: isActive 
                            ? 'perspective(1000px) rotateY(0deg) scale(1)' 
                            : `perspective(1000px) rotateY(${slideIndex < currentNewProductIndex ? '15deg' : '-15deg'}) scale(${1 - distance * 0.1})`,
                          opacity: isActive ? 1 : Math.max(0.3, 1 - distance * 0.3),
                          filter: isActive ? 'blur(0px)' : `blur(${distance * 2}px)`,
                          zIndex: 10 - distance
                        }}
                      >
                        {newProducts.slice(slideIndex * 3, slideIndex * 3 + 3).map((product, idx) => (
                          <div 
                            key={product.id} 
                            className="flex-shrink-0 w-full md:w-1/3 transition-all duration-700"
                            style={{
                              transform: isActive 
                                ? `translateY(0) scale(1)` 
                                : `translateY(${idx % 2 === 0 ? '20px' : '-20px'}) scale(0.9)`,
                              animationDelay: `${idx * 150}ms`
                            }}
                          >
                            <div className={isActive ? 'transform hover:scale-105 transition-transform duration-300' : ''}>
                              <ProductCard product={product} />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Indicadores - Estilo de progresso */}
              {newProducts.length > 3 && (
                <div className="flex flex-col items-center gap-4 mt-12">
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.ceil(newProducts.length / 3) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentNewProductIndex(index)}
                        className="group relative"
                        aria-label={`Ir para slide ${index + 1}`}
                      >
                        <div className={`h-2 rounded-full transition-all duration-500 ${
                          index === currentNewProductIndex
                            ? 'w-12 bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/50'
                            : 'w-2 bg-gray-300 group-hover:bg-emerald-400 group-hover:w-8'
                        }`} />
                        {index === currentNewProductIndex && (
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 font-medium">
                    {currentNewProductIndex + 1} / {Math.ceil(newProducts.length / 3)}
                  </span>
                </div>
              )}

              {/* Botão CTA grande no final */}
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setLocation('/shop')}
                  className="group relative px-10 py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-emerald-500/50 transition-all duration-500 transform hover:scale-110 hover:-translate-y-1 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <span>Ver Todas as Novidades</span>
                    <ChevronRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-2" />
                  </span>
                  {/* Efeito de brilho animado contínuo */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                  {/* Efeito de partículas no hover */}
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100">
                    <span className="absolute top-2 left-4 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '0ms' }}></span>
                    <span className="absolute top-4 right-8 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '200ms' }}></span>
                    <span className="absolute bottom-3 left-1/3 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '400ms' }}></span>
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Nenhuma novidade no momento.</p>
              <Button 
                onClick={() => setLocation('/shop')}
                className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                Ver Todos os Produtos
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Seção de Confiança - Nossos Números */}
      <section id="stats-section" className="py-12 px-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white relative overflow-hidden">
        {/* Elementos decorativos animados */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-emerald-400 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }}></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-400 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <h3 className="text-center text-3xl font-bold mb-10 animate-fade-in">
            Nossa Comunidade em Números
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Users, number: "500+", label: "Clientes Satisfeitos", delay: 0 },
              { icon: Package, number: "150+", label: "Produtos Disponíveis", delay: 200 },
              { icon: Star, number: "98%", label: "Avaliação Positiva", delay: 400 },
              { icon: Headphones, number: "24/7", label: "Suporte Disponível", delay: 600 },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={idx} 
                  className={`text-center transition-all duration-700 ${
                    isStatsVisible 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-10'
                  }`}
                  style={{
                    transitionDelay: `${stat.delay}ms`,
                    animation: isStatsVisible ? `bounceIn 0.8s ease-out ${stat.delay}ms both` : 'none'
                  }}
                >
                  <div className="flex justify-center mb-3 group">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg hover:shadow-emerald-500/50 transition-all duration-500 transform hover:scale-110 hover:rotate-12 relative overflow-hidden">
                      {/* Efeito de brilho rotativo */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <Icon className="w-8 h-8 text-white relative z-10 transition-transform duration-300 group-hover:scale-110" />
                      {/* Anel pulsante */}
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-75"></div>
                    </div>
                  </div>
                  <p 
                    className="text-3xl font-bold mb-2 transition-all duration-500 hover:scale-110 inline-block"
                    style={{
                      animation: isStatsVisible ? `countUp 1s ease-out ${stat.delay + 300}ms both` : 'none'
                    }}
                  >
                    {stat.number}
                  </p>
                  <p className="text-gray-300 transition-colors duration-300 group-hover:text-white">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CSS para animações */}
        <style>{`
          @keyframes bounceIn {
            0% {
              opacity: 0;
              transform: translateY(30px) scale(0.8);
            }
            50% {
              transform: translateY(-10px) scale(1.05);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes countUp {
            0% {
              opacity: 0;
              transform: scale(0.5);
            }
            50% {
              transform: scale(1.2);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          .animate-fade-in {
            animation: fadeIn 1s ease-out;
          }
        `}</style>
      </section>

      {/* Seção de Depoimentos */}
      <section id="reviews-section" className="py-12 px-4 bg-white relative overflow-hidden">
        {/* Elementos decorativos animados */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-10 w-96 h-96 bg-blue-200 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-purple-200 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-10">
            <h3 
              className={`text-3xl font-bold text-gray-800 mb-2 transition-all duration-1000 ${
                isReviewsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              O que Nossas Clientes Dizem
            </h3>
            <p 
              className={`text-gray-600 transition-all duration-1000 delay-200 ${
                isReviewsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            >
              Depoimentos de mães que confiam em nós
            </p>
          </div>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((review, idx) => (
                <div 
                  key={review.id} 
                  className={`bg-gray-50 p-6 rounded-lg border border-gray-200 transition-all duration-700 hover:shadow-xl hover:scale-105 group ${
                    isReviewsVisible 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-20'
                  }`}
                  style={{
                    transitionDelay: `${idx * 150}ms`,
                    animation: isReviewsVisible ? `slideInUp 0.8s ease-out ${idx * 150}ms both` : 'none'
                  }}
                >
                  {/* Estrelas animadas */}
                  <div className="flex gap-1 mb-3">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star 
                        key={i} 
                        className="w-5 h-5 fill-yellow-400 text-yellow-400 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12"
                        style={{
                          animation: isReviewsVisible ? `starPop 0.5s ease-out ${(idx * 150) + (i * 100)}ms both` : 'none'
                        }}
                      />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-gray-700 mb-4 italic transition-colors duration-300 group-hover:text-gray-900">
                      "{review.comment}"
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg relative overflow-hidden">
                      {/* Efeito de brilho no hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <span className="relative z-10">
                        {review.user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 transition-colors duration-300 group-hover:text-blue-600">
                        {review.user.name}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: "Maria Silva",
                  role: "Mãe de 2 filhos",
                  text: "Produtos de excelente qualidade e atendimento impecável. Recomendo!",
                  rating: 5,
                  date: "2 semanas atrás",
                },
                {
                  name: "João Santos",
                  role: "Pai",
                  text: "As roupas são lindas e muito confortáveis. Meus filhos adoram!",
                  rating: 5,
                  date: "1 mês atrás",
                },
                {
                  name: "Ana Costa",
                  role: "Mãe",
                  text: "Frete rápido e embalagem perfeita. Já compro há meses e sempre estou satisfeita.",
                  rating: 5,
                  date: "3 semanas atrás",
                },
              ].map((testimonial, idx) => (
                <div 
                  key={idx} 
                  className={`bg-gray-50 p-6 rounded-lg border border-gray-200 transition-all duration-700 hover:shadow-xl hover:scale-105 group ${
                    isReviewsVisible 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-20'
                  }`}
                  style={{
                    transitionDelay: `${idx * 150}ms`,
                    animation: isReviewsVisible ? `slideInUp 0.8s ease-out ${idx * 150}ms both` : 'none'
                  }}
                >
                  {/* Estrelas animadas */}
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star 
                        key={i} 
                        className="w-5 h-5 fill-yellow-400 text-yellow-400 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12"
                        style={{
                          animation: isReviewsVisible ? `starPop 0.5s ease-out ${(idx * 150) + (i * 100)}ms both` : 'none'
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic transition-colors duration-300 group-hover:text-gray-900">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg relative overflow-hidden">
                      {/* Efeito de brilho no hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <span className="relative z-10">
                        {testimonial.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 transition-colors duration-300 group-hover:text-blue-600">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-gray-500">{testimonial.role} • {testimonial.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CSS para animações dos depoimentos */}
        <style>{`
          @keyframes slideInUp {
            0% {
              opacity: 0;
              transform: translateY(40px) scale(0.9);
            }
            60% {
              transform: translateY(-5px) scale(1.02);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes starPop {
            0% {
              opacity: 0;
              transform: scale(0) rotate(0deg);
            }
            50% {
              transform: scale(1.3) rotate(180deg);
            }
            100% {
              opacity: 1;
              transform: scale(1) rotate(360deg);
            }
          }
        `}</style>
      </section>

    </>
  );
}

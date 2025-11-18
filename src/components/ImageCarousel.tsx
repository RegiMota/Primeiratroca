import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { settingsAPI } from "@/lib/api";
import { useLocation } from "wouter";

interface CarouselSlide {
  id: number;
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText: string;
  buttonLink: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'gif';
  bgColor?: string;
  emoji?: string;
}

const defaultSlides: CarouselSlide[] = [
  {
    id: 1,
    title: "O Primeiro Toque de Carinho",
    subtitle: "Conforto e Segurança para o Seu Recém-Nascido",
    bgColor: "from-blue-200 via-pink-100 to-purple-200",
    emoji: "👶",
    buttonText: "Ver Coleção",
    buttonLink: "/shop",
  },
  {
    id: 2,
    title: "Qualidade Premium para Bebês",
    subtitle: "Tecidos Macios e Seguros para a Pele Delicada",
    bgColor: "from-pink-200 via-purple-100 to-blue-200",
    emoji: "🧸",
    buttonText: "Ver Coleção",
    buttonLink: "/shop",
  },
  {
    id: 3,
    title: "Estilo e Conforto Combinados",
    subtitle: "Roupas Lindas que Seu Bebê Vai Adorar",
    bgColor: "from-purple-200 via-pink-100 to-blue-200",
    emoji: "👕",
    buttonText: "Ver Coleção",
    buttonLink: "/shop",
  },
  {
    id: 4,
    title: "Enxoval Completo para o Seu Pequeno",
    subtitle: "Tudo que Você Precisa em Um Só Lugar",
    bgColor: "from-yellow-100 via-pink-100 to-green-100",
    emoji: "🎁",
    buttonText: "Ver Coleção",
    buttonLink: "/shop",
  },
];

export default function ImageCarousel() {
  const [, setLocation] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [slides, setSlides] = useState<CarouselSlide[]>(defaultSlides);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSlides = async () => {
      try {
        const slidesData = await settingsAPI.getHeroSlides();
        if (slidesData && slidesData.length > 0) {
          // Converter slides do backend para o formato esperado
          const formattedSlides = slidesData.map((slide: any, index: number) => ({
            id: slide.id || index + 1,
            title: slide.title || "",
            subtitle: slide.subtitle || "",
            description: slide.description || "",
            buttonText: slide.buttonText || "Ver Coleção",
            buttonLink: slide.buttonLink || "/shop",
            mediaUrl: slide.mediaUrl || undefined,
            mediaType: slide.mediaType || (slide.mediaUrl ? 'image' : undefined),
            bgColor: slide.bgColor || defaultSlides[index % defaultSlides.length].bgColor,
            emoji: slide.emoji || defaultSlides[index % defaultSlides.length].emoji,
          }));
          setSlides(formattedSlides);
        }
      } catch (error) {
        console.error('Error loading hero slides:', error);
        // Manter slides padrão em caso de erro
        setSlides(defaultSlides.map(s => ({
          ...s,
          buttonText: "Ver Coleção",
          buttonLink: "/shop",
        })));
      } finally {
        setLoading(false);
      }
    };

    loadSlides();
  }, []);

  useEffect(() => {
    if (!autoPlay || slides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 10000);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 10000);
  };

  const slide = slides[currentSlide];

  return (
    <div className="relative h-96 md:h-[500px] bg-white overflow-hidden">
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((s, index) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className={`w-full h-full bg-gradient-to-r ${s.bgColor || 'from-blue-200 via-pink-100 to-purple-200'} flex items-center justify-center relative overflow-hidden`}>
              {/* Mídia de fundo (imagem ou vídeo) */}
              {s.mediaUrl && (
                <div className="absolute inset-0 z-0">
                  {s.mediaType === 'video' ? (
                    <video
                      src={s.mediaUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={s.mediaUrl}
                      alt={s.title || "Slide"}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* Overlay escuro para melhorar legibilidade do texto */}
                  <div className="absolute inset-0 bg-black/30"></div>
                </div>
              )}

              {/* Animated background elements (apenas se não houver mídia) */}
              {!s.mediaUrl && (
                <>
                  <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
                </>
              )}

              {/* Content */}
              <div className="text-center z-10 px-4">
                {/* Emoji ou ícone (apenas se não houver mídia) */}
                {!s.mediaUrl && s.emoji && (
                  <div className="text-6xl md:text-7xl mb-4 animate-bounce">{s.emoji}</div>
                )}
                
                {/* Título */}
                {s.title && (
                  <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${s.mediaUrl ? 'text-white drop-shadow-lg' : 'text-gray-800'}`}>
                    {s.title}
                  </h2>
                )}
                
                {/* Subtítulo ou descrição */}
                {(s.subtitle || s.description) && (
                  <p className={`text-lg md:text-xl mb-6 ${s.mediaUrl ? 'text-white drop-shadow-md' : 'text-gray-600'}`}>
                    {s.subtitle || s.description}
                  </p>
                )}
                
                {/* Botão */}
                <button 
                  onClick={() => setLocation(s.buttonLink || '/shop')}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  {s.buttonText || "Ver Coleção"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-emerald-500 w-8"
                : "bg-white/60 hover:bg-white/80"
            }`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute top-6 right-6 z-20 bg-white/80 px-4 py-2 rounded-full text-sm font-semibold text-gray-800">
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  );
}

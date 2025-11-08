import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { settingsAPI } from '../lib/api';

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  description?: string;
  price?: string;
  originalPrice?: string;
  buttonText: string;
  buttonLink: string;
  backgroundImage?: string;
  mediaUrl?: string; // URL para imagem, vídeo ou GIF
  mediaType?: 'image' | 'video' | 'gif'; // Tipo de mídia (opcional, será detectado automaticamente)
}

// Função para detectar o tipo de mídia pela URL
function detectMediaType(url: string): 'image' | 'video' | 'gif' {
  const lowerUrl = url.toLowerCase();
  
  // Vídeos
  if (lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.ogg') || lowerUrl.includes('.mov')) {
    return 'video';
  }
  
  // GIFs
  if (lowerUrl.includes('.gif')) {
    return 'gif';
  }
  
  // Imagens (padrão)
  return 'image';
}

export function Hero() {
  const [, setLocation] = useLocation();
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSlides = async () => {
      try {
        const slides = await settingsAPI.getHeroSlides();
        setHeroSlides(slides);
      } catch (error) {
        console.error('Error loading hero slides:', error);
        // Fallback para slides padrão se a API falhar
        setHeroSlides([
          {
            id: 1,
            title: 'Macacão Peluciado',
            subtitle: 'FLEECE',
            description: 'Conforto e qualidade para seu bebê',
            price: '119',
            originalPrice: '149',
            buttonText: 'Compre aqui',
            buttonLink: '/shop?category=body&promo=true',
            mediaUrl: 'https://d3m5ncion0j1nd.cloudfront.net/Custom/Content/Themes/Shared/Videos/Ver%C3%A3o_Desktop.mp4?v=2025-11-05_09-48',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadSlides();
  }, []);

  if (loading) {
    return (
      <section className="relative w-full overflow-hidden" style={{ margin: '0', padding: '0', width: '100%' }}>
        <div className="flex h-96 items-center justify-center bg-gray-100">
          <p className="text-gray-600">Carregando carrossel...</p>
        </div>
      </section>
    );
  }

  if (heroSlides.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full overflow-hidden" style={{ margin: '0', padding: '0', width: '100%', maxWidth: '100vw' }}>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
          duration: 20,
        }}
        className="w-full"
        style={{ width: '100%', margin: '0', padding: '0', maxWidth: '100%' }}
      >
        <CarouselContent className="!ml-0 !mr-0" style={{ marginLeft: '0', marginRight: '0' }}>
          {heroSlides.map((slide) => {
            // Determinar URL e tipo de mídia
            const mediaUrl = slide.mediaUrl || slide.backgroundImage;
            const mediaType = slide.mediaType || (mediaUrl ? detectMediaType(mediaUrl) : null);
            
            return (
              <CarouselItem key={slide.id} className="!pl-0 !pr-0 basis-full" style={{ paddingLeft: '0', paddingRight: '0', width: '100%', maxWidth: '100%' }}>
                <div 
                  onClick={() => setLocation(slide.buttonLink)}
                  className="relative w-full flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-95 transition-opacity duration-300"
                  style={{ 
                    minHeight: '300px',
                    height: '400px',
                    margin: '0',
                    padding: '0',
                    width: '100%',
                    maxWidth: '100%',
                    background: !mediaUrl ? 'linear-gradient(135deg, #46D392 0%, #3ABF7F 100%)' : 'transparent'
                  }}
                >
                  {/* Renderizar mídia baseado no tipo */}
                  {mediaUrl && mediaType === 'video' && (
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      style={{ zIndex: 0, maxWidth: '100%' }}
                    >
                      <source src={mediaUrl} type="video/mp4" />
                      Seu navegador não suporta vídeos.
                    </video>
                  )}
                  
                  {mediaUrl && (mediaType === 'image' || mediaType === 'gif') && (
                    <img
                      src={mediaUrl}
                      alt={slide.title}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      style={{ zIndex: 0, maxWidth: '100%' }}
                    />
                  )}
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        
        {/* Botões de navegação - Responsivos */}
        <CarouselPrevious 
          className="left-2 md:left-4 h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 z-30" 
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#111827' }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
        <CarouselNext 
          className="right-2 md:right-4 h-10 w-10 md:h-12 md:w-12 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 z-30" 
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#111827' }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      </Carousel>
    </section>
  );
}

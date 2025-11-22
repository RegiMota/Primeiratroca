import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { announcementsAPI } from '../lib/api';

interface Announcement {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  link?: string;
  type: string;
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
}

const typeStyles: Record<string, { bg: string; text: string; border: string }> = {
  promo: {
    bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
    text: 'text-white',
    border: 'border-purple-600',
  },
  alert: {
    bg: 'bg-gradient-to-r from-red-500 to-orange-500',
    text: 'text-white',
    border: 'border-red-600',
  },
  info: {
    bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    text: 'text-white',
    border: 'border-blue-600',
  },
  warning: {
    bg: 'bg-gradient-to-r from-yellow-500 to-amber-500',
    text: 'text-white',
    border: 'border-yellow-600',
  },
};

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await announcementsAPI.getAll();
      console.log('[AnnouncementBanner] Received announcements:', data);
      
      // Filtrar apenas avisos ativos e dentro do período válido
      const now = new Date();
      const activeAnnouncements = data.filter((announcement: Announcement) => {
        if (!announcement.isActive) {
          console.log(`[AnnouncementBanner] Skipping ${announcement.title} - not active`);
          return false;
        }
        
        // Verificar data de início
        if (announcement.startDate) {
          const startDate = new Date(announcement.startDate);
          if (startDate > now) {
            console.log(`[AnnouncementBanner] Skipping ${announcement.title} - start date in future`);
            return false;
          }
        }
        
        // Verificar data de fim
        if (announcement.endDate) {
          const endDate = new Date(announcement.endDate);
          // Adicionar 1 dia para incluir o dia inteiro
          endDate.setHours(23, 59, 59, 999);
          if (endDate < now) {
            console.log(`[AnnouncementBanner] Skipping ${announcement.title} - end date passed`);
            return false;
          }
        }
        
        console.log(`[AnnouncementBanner] Including ${announcement.title}`);
        return true;
      });
      
      console.log(`[AnnouncementBanner] Active announcements: ${activeAnnouncements.length}`);
      setAnnouncements(activeAnnouncements);
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  // Carregar IDs já fechados do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dismissedAnnouncements');
    if (saved) {
      try {
        setDismissedIds(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing dismissed announcements:', e);
      }
    }
  }, []);

  // Rotação automática de avisos (a cada 5 segundos)
  useEffect(() => {
    if (announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [announcements.length]);

  const handleDismiss = (id: number) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
  };

  // Filtrar avisos não fechados
  const visibleAnnouncements = announcements.filter(
    (announcement) => !dismissedIds.includes(announcement.id)
  );

  if (visibleAnnouncements.length === 0) return null;

  const currentAnnouncement = visibleAnnouncements[currentIndex];
  const style = typeStyles[currentAnnouncement.type] || typeStyles.info;

  return (
    <div
      className={`${style.bg} ${style.text} border-b ${style.border} shadow-lg relative z-50`}
    >
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Imagem (se houver) */}
          {currentAnnouncement.imageUrl && (
            <div className="flex-shrink-0 hidden sm:block">
              <img
                src={currentAnnouncement.imageUrl}
                alt={currentAnnouncement.title}
                className="h-12 w-12 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            {currentAnnouncement.link ? (
              <a
                href={currentAnnouncement.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <h3 className="font-bold text-sm sm:text-base truncate">
                  {currentAnnouncement.title}
                </h3>
                {currentAnnouncement.description && (
                  <p className="text-xs sm:text-sm opacity-90 truncate hidden md:block">
                    {currentAnnouncement.description}
                  </p>
                )}
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
              </a>
            ) : (
              <div>
                <h3 className="font-bold text-sm sm:text-base truncate">
                  {currentAnnouncement.title}
                </h3>
                {currentAnnouncement.description && (
                  <p className="text-xs sm:text-sm opacity-90 truncate hidden md:block">
                    {currentAnnouncement.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Indicadores de múltiplos avisos */}
          {visibleAnnouncements.length > 1 && (
            <div className="flex items-center gap-1">
              {visibleAnnouncements.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-white opacity-100 scale-125'
                      : 'bg-white opacity-50 hover:opacity-75'
                  }`}
                  aria-label={`Ver aviso ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Botão de fechar */}
          <button
            onClick={() => handleDismiss(currentAnnouncement.id)}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}


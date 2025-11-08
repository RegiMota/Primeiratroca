import { useState, useEffect } from 'react';
import { Send, RefreshCw, CreditCard, Package, Truck, Shield, Heart, Star } from 'lucide-react';
import { settingsAPI } from '../lib/api';

interface RuleItem {
  icon: React.ComponentType<{ className?: string }>;
  mainText: string;
  subText: string;
  color?: string;
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

export function RulesBar() {
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCards = async () => {
      try {
        const cards = await settingsAPI.getBenefitCards();
        const mappedRules: RuleItem[] = cards.map((card: { iconName: string; mainText: string; subText: string; color?: string }) => ({
          icon: iconMap[card.iconName] || Send,
          mainText: card.mainText,
          subText: card.subText,
          color: card.color,
        }));
        setRules(mappedRules);
      } catch (error) {
        console.error('Error loading benefit cards:', error);
        // Fallback para cards padrão se a API falhar
        setRules([
          {
            icon: Send,
            mainText: 'Frete grátis',
            subText: 'Para compras acima de R$ 239',
            color: '#FF6B35',
          },
          {
            icon: RefreshCw,
            mainText: 'Troca grátis',
            subText: 'Na primeira compra',
            color: '#FFD93D',
          },
          {
            icon: CreditCard,
            mainText: 'Parcele sem juros',
            subText: 'Em até 6x',
            color: '#9B59B6',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, []);

  if (loading) {
    return (
      <section className="w-full" style={{ backgroundColor: '#FFFFFF', margin: '0', padding: '0' }}>
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex items-center justify-center py-6 md:py-8">
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </section>
    );
  }

  if (rules.length === 0) {
    return null;
  }

  // Cores padrão caso não tenha cor definida (laranja, amarelo, roxo)
  const defaultColors = ['#FF6B35', '#FFD93D', '#9B59B6'];

  return (
    <section className="w-full" style={{ backgroundColor: '#FFFFFF', margin: '0', padding: '0' }}>
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 md:py-8">
          {rules.map((rule, index) => {
            const Icon = rule.icon;
            // Usar a cor do banco de dados se existir, senão usar cor padrão
            const cardColor = (rule as any).color || defaultColors[index] || defaultColors[0];
            return (
              <div
                key={index}
                className="flex flex-row items-center gap-3 md:gap-4 p-4 md:p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                style={{ backgroundColor: cardColor }}
              >
                <div className="flex-shrink-0">
                  <div 
                    className="flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-full"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
                  >
                    <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm md:text-base font-bold text-white">
                    {rule.mainText}
                  </span>
                  <span className="text-xs md:text-sm text-white/95">
                    {rule.subText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


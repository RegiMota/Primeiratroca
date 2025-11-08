import { 
  Award, Heart, Star, Sparkles, CheckCircle2
} from 'lucide-react';
import { Badge } from '../components/ui/badge';

// Paleta Inovadora / Moderna
const colors = {
  primaria: '#0F172A',      // Azul bem escuro / quase preto — base elegante
  secundaria: '#46D392',    // Verde-esmeralda — CTA e destaque
  acento: '#F97316',         // Laranja vibrante — promoções e badges
  neutraClara: '#F8FAFC',   // Off-white — fundos e cards
  neutraMedia: '#94A3B8',   // Azul-cinza — elementos secundários
};

export function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.neutraClara }}>
      {/* Hero Section */}
      <section className="py-16 md:py-24 lg:py-32 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, ${colors.primaria} 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-16">
            <Badge 
              className="mb-4 text-white border-0 shadow-lg px-4 py-1.5 text-sm font-semibold"
              style={{ backgroundColor: colors.acento }}
            >
              <Award className="mr-2 h-4 w-4" />
              Sobre Nós
            </Badge>
            <h1 
              className="mb-6 text-4xl md:text-5xl lg:text-6xl font-extrabold"
              style={{ color: colors.primaria }}
            >
              Nossa História
            </h1>
            <p 
              className="mx-auto max-w-3xl text-lg md:text-xl leading-relaxed"
              style={{ color: colors.neutraMedia }}
            >
              Dedicados a vestir os pequenos com qualidade, conforto e muito carinho. 
              Somos uma loja especializada em moda infantil, comprometida em oferecer 
              o melhor para as famílias brasileiras.
            </p>
          </div>
        </div>
      </section>

      {/* Missão, Valores e Visão */}
      <section className="py-16 md:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-12 md:grid-cols-3 mb-16">
            {/* Missão */}
            <div className="text-center">
              <div 
                className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110"
                style={{ backgroundColor: colors.secundaria }}
              >
                <Heart className="h-10 w-10 text-white fill-white" />
              </div>
              <h2 
                className="mb-4 text-2xl md:text-3xl font-bold"
                style={{ color: colors.primaria }}
              >
                Nossa Missão
              </h2>
              <p 
                className="text-base md:text-lg leading-relaxed"
                style={{ color: colors.neutraMedia }}
              >
                Oferecer roupas infantis de alta qualidade, com foco em conforto, segurança e estilo, 
                proporcionando momentos especiais para cada família.
              </p>
            </div>

            {/* Valores */}
            <div className="text-center">
              <div 
                className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110"
                style={{ backgroundColor: colors.secundaria }}
              >
                <Star className="h-10 w-10 text-white fill-white" />
              </div>
              <h2 
                className="mb-4 text-2xl md:text-3xl font-bold"
                style={{ color: colors.primaria }}
              >
                Nossos Valores
              </h2>
              <p 
                className="text-base md:text-lg leading-relaxed"
                style={{ color: colors.neutraMedia }}
              >
                Qualidade, transparência, responsabilidade social e compromisso com a satisfação 
                de nossos clientes e o bem-estar das crianças.
              </p>
            </div>

            {/* Visão */}
            <div className="text-center">
              <div 
                className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110"
                style={{ backgroundColor: colors.secundaria }}
              >
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h2 
                className="mb-4 text-2xl md:text-3xl font-bold"
                style={{ color: colors.primaria }}
              >
                Nossa Visão
              </h2>
              <p 
                className="text-base md:text-lg leading-relaxed"
                style={{ color: colors.neutraMedia }}
              >
                Ser referência nacional em moda infantil, reconhecida pela excelência, inovação 
                e pelo carinho dedicado a cada peça.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-16 md:py-20 lg:py-24" style={{ backgroundColor: colors.neutraClara }}>
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 
              className="mb-4 text-3xl md:text-4xl lg:text-5xl font-extrabold"
              style={{ color: colors.primaria }}
            >
              Por Que Escolher a Primaira & Troca & Cia?
            </h2>
            <p 
              className="mx-auto max-w-2xl text-lg"
              style={{ color: colors.neutraMedia }}
            >
              Conheça os diferenciais que fazem da nossa loja a melhor escolha para vestir seus pequenos
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-6 rounded-lg transition-all hover:shadow-lg" style={{ backgroundColor: 'white' }}>
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4" style={{ color: colors.secundaria }} />
              <h3 
                className="mb-2 text-xl font-semibold"
                style={{ color: colors.primaria }}
              >
                Qualidade Garantida
              </h3>
              <p 
                className="text-sm md:text-base"
                style={{ color: colors.neutraMedia }}
              >
                Produtos selecionados e testados para garantir a melhor qualidade e segurança para as crianças.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg transition-all hover:shadow-lg" style={{ backgroundColor: 'white' }}>
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4" style={{ color: colors.secundaria }} />
              <h3 
                className="mb-2 text-xl font-semibold"
                style={{ color: colors.primaria }}
              >
                Atendimento Personalizado
              </h3>
              <p 
                className="text-sm md:text-base"
                style={{ color: colors.neutraMedia }}
              >
                Suporte dedicado e personalizado para atender todas as suas necessidades e dúvidas.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg transition-all hover:shadow-lg" style={{ backgroundColor: 'white' }}>
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4" style={{ color: colors.secundaria }} />
              <h3 
                className="mb-2 text-xl font-semibold"
                style={{ color: colors.primaria }}
              >
                Entrega Rápida
              </h3>
              <p 
                className="text-sm md:text-base"
                style={{ color: colors.neutraMedia }}
              >
                Receba seus pedidos com agilidade e segurança, com rastreamento em tempo real.
              </p>
            </div>
            <div className="text-center p-6 rounded-lg transition-all hover:shadow-lg" style={{ backgroundColor: 'white' }}>
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4" style={{ color: colors.secundaria }} />
              <h3 
                className="mb-2 text-xl font-semibold"
                style={{ color: colors.primaria }}
              >
                Sustentabilidade
              </h3>
              <p 
                className="text-sm md:text-base"
                style={{ color: colors.neutraMedia }}
              >
                Compromisso com o meio ambiente através de práticas sustentáveis e responsáveis.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


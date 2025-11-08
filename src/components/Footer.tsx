import { 
  Heart, Mail, Phone, MapPin, Facebook, Instagram, 
  Twitter, Youtube, ShoppingBag, User, Package, 
  HelpCircle, FileText, Award
} from 'lucide-react';
import { useLocation } from 'wouter';

const colors = {
  primaria: '#0F172A',
  secundaria: '#46D392',
  acento: '#F97316',
  neutraClara: '#F8FAFC',
  neutraMedia: '#94A3B8',
};

export function Footer() {
  const [, setLocation] = useLocation();

  return (
    <footer style={{ backgroundColor: colors.primaria }} className="text-white">
      {/* Footer Principal */}
      <div className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            {/* Sobre a Loja */}
            <div>
              <div className="mb-6 flex items-center gap-3">
                <ShoppingBag className="h-8 w-8" style={{ color: colors.secundaria }} />
                <h3 className="text-xl font-bold">Primaira Troca & Cia</h3>
              </div>
              <p 
                className="mb-6 text-sm leading-relaxed"
                style={{ color: colors.neutraMedia }}
              >
                Especializada em roupas infantis de qualidade, oferecendo conforto, estilo e segurança para os pequenos.
              </p>
              <div className="flex gap-4">
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110"
                  style={{ backgroundColor: `${colors.secundaria}20`, color: colors.secundaria }}
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110"
                  style={{ backgroundColor: `${colors.secundaria}20`, color: colors.secundaria }}
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110"
                  style={{ backgroundColor: `${colors.secundaria}20`, color: colors.secundaria }}
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a 
                  href="https://youtube.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110"
                  style={{ backgroundColor: `${colors.secundaria}20`, color: colors.secundaria }}
                >
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Links Úteis */}
            <div>
              <h3 className="mb-6 text-lg font-bold">Links Úteis</h3>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => setLocation('/shop')}
                    className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
                    style={{ color: colors.neutraMedia }}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Loja
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setLocation('/about')}
                    className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
                    style={{ color: colors.neutraMedia }}
                  >
                    <Award className="h-4 w-4" />
                    Sobre Nós
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setLocation('/profile')}
                    className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
                    style={{ color: colors.neutraMedia }}
                  >
                    <User className="h-4 w-4" />
                    Minha Conta
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setLocation('/orders')}
                    className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
                    style={{ color: colors.neutraMedia }}
                  >
                    <Package className="h-4 w-4" />
                    Meus Pedidos
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setLocation('/faq')}
                    className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
                    style={{ color: colors.neutraMedia }}
                  >
                    <HelpCircle className="h-4 w-4" />
                    Perguntas Frequentes
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setLocation('/tickets')}
                    className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
                    style={{ color: colors.neutraMedia }}
                  >
                    <HelpCircle className="h-4 w-4" />
                    Suporte
                  </button>
                </li>
              </ul>
            </div>

            {/* Informações Legais */}
            <div>
              <h3 className="mb-6 text-lg font-bold">Informações</h3>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => setLocation('/privacy-policy')}
                    className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
                    style={{ color: colors.neutraMedia }}
                  >
                    <FileText className="h-4 w-4" />
                    Política de Privacidade
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setLocation('/terms-of-use')}
                    className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
                    style={{ color: colors.neutraMedia }}
                  >
                    <FileText className="h-4 w-4" />
                    Termos de Uso
                  </button>
                </li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <h3 className="mb-6 text-lg font-bold">Contato</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: colors.secundaria }} />
                  <div>
                    <p className="text-sm" style={{ color: colors.neutraMedia }}>
                      Av. das Acácias, 2055 - Sala 5<br />
                      Jardim Botânico, Sinop - MT<br />
                      CEP: 78550-306
                    </p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 flex-shrink-0" style={{ color: colors.secundaria }} />
                  <a 
                    href="tel:+5566996768065" 
                    className="text-sm transition-colors hover:opacity-80"
                    style={{ color: colors.neutraMedia }}
                  >
                    (66) 99676-8065
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 flex-shrink-0" style={{ color: colors.secundaria }} />
                  <a 
                    href="mailto:contato@primeiratrocaecia.com.br" 
                    className="text-sm transition-colors hover:opacity-80"
                    style={{ color: colors.neutraMedia }}
                  >
                    contato@primeiratrocaecia.com.br
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Inferior */}
      <div 
        className="border-t py-6"
        style={{ borderColor: `${colors.neutraMedia}30`, backgroundColor: `${colors.primaria}dd` }}
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p className="flex items-center gap-2" style={{ color: colors.neutraMedia }}>
              <Heart className="h-4 w-4 text-red-500 fill-red-500" />
              Roupas que abraçam o começo da vida ❤️
            </p>
            <p style={{ color: colors.neutraMedia }}>
              © 2025 Primaira Troca & Cia. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { useLocation } from 'wouter';
import { Facebook, Instagram, Youtube, Lock, CheckCircle2, CreditCard, Heart } from 'lucide-react';

// Componente de ícone do TikTok customizado
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export function Footer() {
  const [, setLocation] = useLocation();

  return (
    <footer className="bg-gradient-to-r from-slate-900 to-slate-800 text-gray-300 py-12 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Sobre */}
          <div>
            <h4 className="font-bold text-white mb-4">Primeira Troca & Cia</h4>
            <p className="text-sm">Especializada em roupas infantis de qualidade, oferecendo conforto, estilo e a máxima segurança para a pele delicada do seu bebê.</p>
            <p className="text-sm mt-4 italic text-emerald-400 font-semibold">"Roupas que abraçam o começo da vida"</p>
          </div>

          {/* Links Úteis */}
          <div>
            <h4 className="font-bold text-white mb-4">Links Úteis</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setLocation('/shop')} className="hover:text-emerald-400 transition">Loja</button></li>
              <li><button onClick={() => setLocation('/about')} className="hover:text-emerald-400 transition">Sobre Nós</button></li>
              <li><button onClick={() => setLocation('/profile')} className="hover:text-emerald-400 transition">Minha Conta</button></li>
              <li><button onClick={() => setLocation('/orders')} className="hover:text-emerald-400 transition">Meus Pedidos</button></li>
              <li><button onClick={() => setLocation('/faq')} className="hover:text-emerald-400 transition">Perguntas Frequentes</button></li>
              <li><button onClick={() => setLocation('/tickets')} className="hover:text-emerald-400 transition">Suporte</button></li>
            </ul>
          </div>

          {/* Informações Legais */}
          <div>
            <h4 className="font-bold text-white mb-4">Informações</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => setLocation('/privacy-policy')} className="hover:text-emerald-400 transition">Política de Privacidade</button></li>
              <li><button onClick={() => setLocation('/terms-of-use')} className="hover:text-emerald-400 transition">Termos de Uso</button></li>
              <li><button onClick={() => setLocation('/exchange-return-policy')} className="hover:text-emerald-400 transition">Política de Troca e Devolução</button></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-bold text-white mb-4">Contato</h4>
            <p className="text-sm mb-2">Av. das Acácias, 2055 - Sala 5</p>
            <p className="text-sm mb-2">Jardim Botânico, Sinop - MT</p>
            <p className="text-sm mb-2">CEP: 78550-306</p>
            <p className="text-sm mb-2">(66) 99676-8065</p>
            <p className="text-sm">contato@primeirotropoca.com.br</p>
          </div>
        </div>

        {/* Redes Sociais e Selos */}
        <div className="border-t border-gray-700 pt-8">
          {/* Redes Sociais */}
          <div className="flex justify-center gap-4 mb-8">
            <a 
              href="https://www.facebook.com/share/1DKpwncVpV/?mibextid=wwXIfr" 
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-[#1877F2] hover:bg-[#166FE5] flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:shadow-lg shadow-md group"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>
            <a 
              href="https://www.instagram.com/primeiratrocaecia/" 
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:shadow-lg shadow-md group"
              style={{
                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
              }}
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>
            <a 
              href="https://www.tiktok.com/@primeiratrocaecia" 
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-black hover:bg-gray-900 flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:shadow-lg shadow-md group"
              aria-label="TikTok"
            >
              <TikTokIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>
            <a 
              href="https://www.youtube.com/@PrimeiraTrocaecia" 
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-[#FF0000] hover:bg-[#CC0000] flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:shadow-lg shadow-md group"
              aria-label="YouTube"
            >
              <Youtube className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>
          </div>

          {/* Selos de Segurança */}
          <div className="flex justify-center gap-3 mb-8 flex-wrap">
            <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">SSL Seguro</span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Compra Segura</span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">Múltiplas Formas de Pagamento</span>
            </div>
          </div>

          {/* Copyright e Tagline */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-400">© 2025 Primeira Troca & Cia. Todos os direitos reservados.</p>
            <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
              <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
              Roupas que abraçam o começo da vida
              <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

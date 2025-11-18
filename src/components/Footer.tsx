import { useLocation } from 'wouter';

export function Footer() {
  const [, setLocation] = useLocation();

  return (
    <footer className="bg-gradient-to-r from-slate-900 to-slate-800 text-gray-300 py-12 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Sobre */}
          <div>
            <h4 className="font-bold text-white mb-4">Primaria Troca & Cia</h4>
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

        {/* Redes Sociais */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex justify-center gap-4 mb-6">
            <a href="#" className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600 transition shadow-md">f</a>
            <a href="#" className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600 transition shadow-md">📷</a>
            <a href="#" className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600 transition shadow-md">𝕏</a>
            <a href="#" className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600 transition shadow-md">▶</a>
          </div>

          {/* Selos de Segurança */}
          <div className="flex justify-center gap-4 mb-6 text-xs flex-wrap">
            <span className="bg-emerald-500 text-white px-3 py-1 rounded shadow-md">🔒 SSL Seguro</span>
            <span className="bg-emerald-500 text-white px-3 py-1 rounded shadow-md">✓ Compra Segura</span>
            <span className="bg-emerald-500 text-white px-3 py-1 rounded shadow-md">💳 Múltiplas Formas de Pagamento</span>
          </div>

          <p className="text-center text-xs text-gray-500">© 2025 Primaria Troca & Cia. Todos os direitos reservados.</p>
          <p className="text-center text-xs text-gray-500 mt-2">❤️ Roupas que abraçam o começo da vida ❤️</p>
        </div>
      </div>
    </footer>
  );
}

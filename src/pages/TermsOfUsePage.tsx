import { FileText, Shield, User, Lock, AlertTriangle, Scale, Mail, CheckCircle2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';

// Paleta Inovadora / Moderna
const colors = {
  primaria: '#0F172A',      // Azul bem escuro / quase preto — base elegante
  secundaria: '#46D392',    // Verde-esmeralda — CTA e destaque
  acento: '#F97316',         // Laranja vibrante — promoções e badges
  neutraClara: '#F8FAFC',   // Off-white — fundos e cards
  neutraMedia: '#94A3B8',   // Azul-cinza — elementos secundários
};

export function TermsOfUsePage() {
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
              <FileText className="mr-2 h-4 w-4" />
              Termos e Condições
            </Badge>
            <h1 
              className="mb-6 text-4xl md:text-5xl lg:text-6xl font-extrabold"
              style={{ color: colors.primaria }}
            >
              Termos de Uso
            </h1>
            <p 
              className="mx-auto max-w-3xl text-lg md:text-xl leading-relaxed"
              style={{ color: colors.neutraMedia }}
            >
              Estes Termos de Uso regulam o seu acesso e uso do site, conteúdos, produtos e serviços oferecidos pela <strong>Primeira Troca & Cia</strong>.
            </p>
            <p 
              className="mx-auto max-w-3xl mt-4 text-base md:text-lg"
              style={{ color: colors.neutraMedia }}
            >
              Última atualização: Janeiro de 2025
            </p>
          </div>
        </div>
      </section>

      {/* Conteúdo Principal */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <div className="space-y-12">
            {/* Introdução */}
            <div className="bg-white rounded-lg shadow-md p-8 md:p-10">
              <p 
                className="text-base md:text-lg leading-relaxed mb-4"
                style={{ color: colors.primaria }}
              >
                Estes Termos de Uso (“Termos”) regulam o seu acesso e uso, como pessoa física ou jurídica, dentro do Brasil, do site, conteúdos, produtos e serviços oferecidos pela <strong>Primeira Troca & Cia</strong>, responsável pela operação desta loja virtual.
              </p>
              <p 
                className="text-base md:text-lg leading-relaxed"
                style={{ color: colors.primaria }}
              >
                A Primeira Troca & Cia poderá alterar estes Termos a qualquer momento, mediante publicação da versão atualizada nesta página. A continuidade do uso dos serviços representa sua concordância com as alterações.
              </p>
            </div>

            {/* Seção 1: Glossário */}
            <div className="bg-white rounded-lg shadow-md p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${colors.secundaria}20` }}
                >
                  <FileText className="h-6 w-6" style={{ color: colors.secundaria }} />
                </div>
                <h2 
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: colors.primaria }}
                >
                  1. Glossário
                </h2>
              </div>
              <div className="space-y-3">
                <p style={{ color: colors.neutraMedia }}>
                  <strong style={{ color: colors.primaria }}>Bug:</strong> Falha lógica que impede a execução de alguma operação no site.
                </p>
                <p style={{ color: colors.neutraMedia }}>
                  <strong style={{ color: colors.primaria }}>Canais de Atendimento:</strong> Canais oficiais de contato informados no rodapé do site.
                </p>
                <p style={{ color: colors.neutraMedia }}>
                  <strong style={{ color: colors.primaria }}>Conta de Acesso:</strong> Credencial que permite o acesso à área de cliente.
                </p>
                <p style={{ color: colors.neutraMedia }}>
                  <strong style={{ color: colors.primaria }}>Primeira Troca & Cia:</strong> Nome fantasia da loja responsável por este site.
                </p>
                <p style={{ color: colors.neutraMedia }}>
                  <strong style={{ color: colors.primaria }}>Glitches:</strong> Funcionamentos inesperados que prejudicam o uso normal do site.
                </p>
                <p style={{ color: colors.neutraMedia }}>
                  <strong style={{ color: colors.primaria }}>Layout:</strong> Conjunto visual e funcional do site, incluindo design e fluxos de navegação.
                </p>
              </div>
            </div>

            {/* Seção 2: Funcionalidade e Acesso */}
            <div className="bg-white rounded-lg shadow-md p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${colors.secundaria}20` }}
                >
                  <User className="h-6 w-6" style={{ color: colors.secundaria }} />
                </div>
                <h2 
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: colors.primaria }}
                >
                  2. Funcionalidade e Acesso ao Site
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    2.1. Funcionalidade
                  </h3>
                  <p 
                    className="text-base leading-relaxed mb-3"
                    style={{ color: colors.neutraMedia }}
                  >
                    O site da Primeira Troca & Cia disponibiliza uma loja virtual que permite:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                    <li style={{ color: colors.neutraMedia }}>Navegar pelos produtos;</li>
                    <li style={{ color: colors.neutraMedia }}>Realizar compras de forma segura;</li>
                    <li style={{ color: colors.neutraMedia }}>Acessar dicas, informações de tamanhos e detalhes dos produtos;</li>
                    <li style={{ color: colors.neutraMedia }}>Falar com os Canais de Atendimento.</li>
                  </ul>
                  <p 
                    className="text-base leading-relaxed mb-3"
                    style={{ color: colors.neutraMedia }}
                  >
                    Após se cadastrar, o cliente poderá:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li style={{ color: colors.neutraMedia }}>Verificar e alterar informações pessoais;</li>
                    <li style={{ color: colors.neutraMedia }}>Acompanhar pedidos, entregas e histórico de compras;</li>
                    <li style={{ color: colors.neutraMedia }}>Consultar notas fiscais;</li>
                    <li style={{ color: colors.neutraMedia }}>Salvar produtos favoritos;</li>
                    <li style={{ color: colors.neutraMedia }}>Solicitar atendimento de pedidos específicos;</li>
                    <li style={{ color: colors.neutraMedia }}>Editar endereços;</li>
                    <li style={{ color: colors.neutraMedia }}>Alterar senha e dados da conta;</li>
                    <li style={{ color: colors.neutraMedia }}>Encerrar a sessão da conta.</li>
                  </ul>
                </div>

                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    2.2. Maioridade
                  </h3>
                  <p 
                    className="text-base leading-relaxed mb-3"
                    style={{ color: colors.neutraMedia }}
                  >
                    O uso do site é livre, mas funções como compras e cadastro devem ser feitas por maiores de 18 anos.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li style={{ color: colors.neutraMedia }}>Menores de 16 anos devem ter supervisão de seus responsáveis.</li>
                    <li style={{ color: colors.neutraMedia }}>Adolescentes entre 16 e 18 anos devem ser assistidos conforme a legislação vigente.</li>
                  </ul>
                </div>

                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    2.3. Recusa de Cadastro
                  </h3>
                  <p 
                    className="text-base leading-relaxed mb-3"
                    style={{ color: colors.neutraMedia }}
                  >
                    A Primeira Troca & Cia poderá recusar, cancelar ou limitar cadastros ou pedidos quando:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li style={{ color: colors.neutraMedia }}>Informações fornecidas forem incorretas;</li>
                    <li style={{ color: colors.neutraMedia }}>Houver suspeita de fraude;</li>
                    <li style={{ color: colors.neutraMedia }}>Houver violação destes Termos.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Seção 3: Responsabilidades */}
            <div className="bg-white rounded-lg shadow-md p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${colors.secundaria}20` }}
                >
                  <Shield className="h-6 w-6" style={{ color: colors.secundaria }} />
                </div>
                <h2 
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: colors.primaria }}
                >
                  3. Responsabilidades da Primeira Troca & Cia
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    3.1. Obrigações da Loja
                  </h3>
                  <p 
                    className="text-base leading-relaxed mb-3"
                    style={{ color: colors.neutraMedia }}
                  >
                    A Primeira Troca & Cia se compromete a:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li style={{ color: colors.neutraMedia }}>Manter o site funcional, claro e navegável;</li>
                    <li style={{ color: colors.neutraMedia }}>Exibir informações completas e corretas;</li>
                    <li style={{ color: colors.neutraMedia }}>Proteger os dados coletados, conforme padrões técnicos e legislação.</li>
                  </ul>
                </div>

                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    3.2. Indisponibilidade
                  </h3>
                  <p 
                    className="text-base leading-relaxed mb-3"
                    style={{ color: colors.neutraMedia }}
                  >
                    O site pode ficar temporariamente indisponível por motivos como:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
                    <li style={{ color: colors.neutraMedia }}>Manutenções;</li>
                    <li style={{ color: colors.neutraMedia }}>Problemas técnicos de provedores externos;</li>
                    <li style={{ color: colors.neutraMedia }}>Eventos de força maior.</li>
                  </ul>
                  <p 
                    className="text-base leading-relaxed"
                    style={{ color: colors.neutraMedia }}
                  >
                    Quando possível, o acesso será restabelecido no menor tempo possível.
                  </p>
                </div>

                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    3.3. Atualizações
                  </h3>
                  <p 
                    className="text-base leading-relaxed mb-3"
                    style={{ color: colors.neutraMedia }}
                  >
                    A loja pode alterar:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li style={{ color: colors.neutraMedia }}>Estes Termos;</li>
                    <li style={{ color: colors.neutraMedia }}>Layout, funcionalidades e conteúdos;</li>
                    <li style={{ color: colors.neutraMedia }}>Processos de compra e cadastro;</li>
                    <li style={{ color: colors.neutraMedia }}>Empresas responsáveis por meios de pagamento ou entrega.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Seção 4: Obrigações do Usuário */}
            <div className="bg-white rounded-lg shadow-md p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${colors.secundaria}20` }}
                >
                  <Lock className="h-6 w-6" style={{ color: colors.secundaria }} />
                </div>
                <h2 
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: colors.primaria }}
                >
                  4. Suas Obrigações como Usuário
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    4.1. Conta de Acesso
                  </h3>
                  <p 
                    className="text-base leading-relaxed"
                    style={{ color: colors.neutraMedia }}
                  >
                    A senha é pessoal, individual e intransferível. O cliente deve mantê-la segura.
                  </p>
                </div>

                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    4.2. Sigilo e Responsabilidade
                  </h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li style={{ color: colors.neutraMedia }}>A loja não se responsabiliza pelo uso indevido da senha pelo próprio cliente.</li>
                    <li style={{ color: colors.neutraMedia }}>Quaisquer operações realizadas após login serão consideradas feitas pelo titular.</li>
                  </ul>
                </div>

                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    4.3. Integridade do Site
                  </h3>
                  <p 
                    className="text-base leading-relaxed mb-3"
                    style={{ color: colors.neutraMedia }}
                  >
                    É proibido:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li style={{ color: colors.neutraMedia }}>Acessar áreas restritas do sistema sem autorização;</li>
                    <li style={{ color: colors.neutraMedia }}>Realizar engenharia reversa;</li>
                    <li style={{ color: colors.neutraMedia }}>Copiar, modificar, reproduzir ou distribuir conteúdos sem permissão.</li>
                  </ul>
                </div>

                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    4.4. Mineração de Dados
                  </h3>
                  <p 
                    className="text-base leading-relaxed"
                    style={{ color: colors.neutraMedia }}
                  >
                    Não é permitido utilizar softwares de mineração ou coleta automatizada de informações.
                  </p>
                </div>

                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    4.5. Indenização
                  </h3>
                  <p 
                    className="text-base leading-relaxed"
                    style={{ color: colors.neutraMedia }}
                  >
                    Em caso de danos ao site ou a terceiros causados pelo uso indevido da sua conta, o usuário será responsável por indenizar integralmente os envolvidos.
                  </p>
                </div>

                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    4.6. Dados Corretos
                  </h3>
                  <p 
                    className="text-base leading-relaxed"
                    style={{ color: colors.neutraMedia }}
                  >
                    O cliente deve fornecer dados verdadeiros, atualizados e completos.
                  </p>
                </div>
              </div>
            </div>

            {/* Seção 5: Propriedade Intelectual */}
            <div className="bg-white rounded-lg shadow-md p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${colors.secundaria}20` }}
                >
                  <Scale className="h-6 w-6" style={{ color: colors.secundaria }} />
                </div>
                <h2 
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: colors.primaria }}
                >
                  5. Propriedade Intelectual
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    5.1. Marca
                  </h3>
                  <p 
                    className="text-base leading-relaxed"
                    style={{ color: colors.neutraMedia }}
                  >
                    A marca <strong>Primeira Troca & Cia</strong> não pode ser utilizada ou reproduzida sem autorização.
                  </p>
                </div>

                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    5.2. Conteúdo
                  </h3>
                  <p 
                    className="text-base leading-relaxed"
                    style={{ color: colors.neutraMedia }}
                  >
                    Todos os textos, fotos, vídeos e demais conteúdos exibidos no site são de propriedade da Primeira Troca & Cia ou de seus licenciadores.
                  </p>
                </div>
              </div>
            </div>

            {/* Seção 6: Privacidade */}
            <div className="bg-white rounded-lg shadow-md p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${colors.secundaria}20` }}
                >
                  <Shield className="h-6 w-6" style={{ color: colors.secundaria }} />
                </div>
                <h2 
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: colors.primaria }}
                >
                  6. Privacidade e Proteção de Dados
                </h2>
              </div>
              <p 
                className="text-base md:text-lg leading-relaxed mb-4"
                style={{ color: colors.neutraMedia }}
              >
                A loja possui documento próprio denominado <strong>Política de Privacidade</strong>, que descreve o tratamento de dados pessoais conforme a LGPD.
              </p>
              <p 
                className="text-base md:text-lg leading-relaxed"
                style={{ color: colors.neutraMedia }}
              >
                A Política de Privacidade é parte integrante deste Termo.
              </p>
            </div>

            {/* Seção 7: Isenções */}
            <div className="bg-white rounded-lg shadow-md p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${colors.secundaria}20` }}
                >
                  <AlertTriangle className="h-6 w-6" style={{ color: colors.secundaria }} />
                </div>
                <h2 
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: colors.primaria }}
                >
                  7. Isenções e Limitações de Responsabilidade
                </h2>
              </div>
              <p 
                className="text-base md:text-lg leading-relaxed mb-4"
                style={{ color: colors.neutraMedia }}
              >
                A Primeira Troca & Cia não se responsabiliza por:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li style={{ color: colors.neutraMedia }}>Bugs, glitches ou falhas causadas nos dispositivos do cliente;</li>
                <li style={{ color: colors.neutraMedia }}>Ataques de hackers ou falhas de conexão à internet do usuário;</li>
                <li style={{ color: colors.neutraMedia }}>Conteúdos de sites externos acessados por links do site;</li>
                <li style={{ color: colors.neutraMedia }}>Decisões tomadas pelo cliente com base em informações da plataforma;</li>
                <li style={{ color: colors.neutraMedia }}>Indisponibilidade temporária do site.</li>
              </ul>
            </div>

            {/* Seção 8: Disposições Finais */}
            <div className="bg-white rounded-lg shadow-md p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${colors.secundaria}20` }}
                >
                  <CheckCircle2 className="h-6 w-6" style={{ color: colors.secundaria }} />
                </div>
                <h2 
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: colors.primaria }}
                >
                  8. Disposições Finais
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    8.1. Canais de Atendimento
                  </h3>
                  <p 
                    className="text-base leading-relaxed"
                    style={{ color: colors.neutraMedia }}
                  >
                    O cliente pode entrar em contato pelos canais informados no rodapé do site.
                  </p>
                </div>

                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    8.2. Atualização dos Termos
                  </h3>
                  <p 
                    className="text-base leading-relaxed"
                    style={{ color: colors.neutraMedia }}
                  >
                    Alterações poderão ocorrer a qualquer momento, e o cliente será notificado pelos meios disponíveis.
                  </p>
                </div>

                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    8.3. Nulidade Parcial
                  </h3>
                  <p 
                    className="text-base leading-relaxed"
                    style={{ color: colors.neutraMedia }}
                  >
                    Se alguma cláusula for considerada inválida, as demais permanecem válidas.
                  </p>
                </div>

                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    8.4. Comunicações Oficiais
                  </h3>
                  <p 
                    className="text-base leading-relaxed"
                    style={{ color: colors.neutraMedia }}
                  >
                    Emails enviados para o endereço cadastrado serão considerados válidos.
                  </p>
                </div>

                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    8.5. Lei Aplicável e Foro
                  </h3>
                  <p 
                    className="text-base leading-relaxed mb-3"
                    style={{ color: colors.neutraMedia }}
                  >
                    Estes Termos são regidos pela legislação brasileira.
                  </p>
                  <p 
                    className="text-base leading-relaxed"
                    style={{ color: colors.neutraMedia }}
                  >
                    Fica eleito o foro do domicílio do cliente para resolução de conflitos, salvo previsão legal específica.
                  </p>
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="bg-gradient-to-r rounded-lg shadow-md p-8 md:p-10" style={{ 
              background: `linear-gradient(135deg, ${colors.secundaria}15 0%, ${colors.acento}10 100%)`,
              border: `2px solid ${colors.secundaria}30`
            }}>
              <h2 
                className="text-2xl md:text-3xl font-bold mb-4"
                style={{ color: colors.primaria }}
              >
                Dúvidas sobre os Termos?
              </h2>
              <p 
                className="text-base md:text-lg leading-relaxed mb-4"
                style={{ color: colors.neutraMedia }}
              >
                Para esclarecer dúvidas sobre estes Termos de Uso, entre em contato conosco através dos nossos canais oficiais de atendimento.
              </p>
              <p 
                className="text-base leading-relaxed"
                style={{ color: colors.neutraMedia }}
              >
                <strong style={{ color: colors.primaria }}>E-mail:</strong> contato@primeiratroca.com.br
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


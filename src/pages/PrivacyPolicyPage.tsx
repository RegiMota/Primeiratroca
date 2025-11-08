import { Shield, Lock, Eye, FileText, Trash2, CheckCircle2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';

// Paleta Inovadora / Moderna
const colors = {
  primaria: '#0F172A',      // Azul bem escuro / quase preto — base elegante
  secundaria: '#46D392',    // Verde-esmeralda — CTA e destaque
  acento: '#F97316',         // Laranja vibrante — promoções e badges
  neutraClara: '#F8FAFC',   // Off-white — fundos e cards
  neutraMedia: '#94A3B8',   // Azul-cinza — elementos secundários
};

export function PrivacyPolicyPage() {
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
              <Shield className="mr-2 h-4 w-4" />
              Proteção de Dados
            </Badge>
            <h1 
              className="mb-6 text-4xl md:text-5xl lg:text-6xl font-extrabold"
              style={{ color: colors.primaria }}
            >
              Política de Privacidade
            </h1>
            <p 
              className="mx-auto max-w-3xl text-lg md:text-xl leading-relaxed"
              style={{ color: colors.neutraMedia }}
            >
              A <strong>Primeira Troca & Cia</strong> valoriza profundamente a segurança, a transparência e a privacidade dos seus dados.
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
                A <strong>Primeira Troca & Cia</strong> valoriza profundamente a segurança, a transparência e a privacidade dos seus dados. Por isso, adotamos práticas rigorosas para garantir que nenhuma informação fornecida por nossos clientes seja compartilhada de forma indevida, sempre respeitando a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD – Lei nº 13.709/2018)</strong>.
              </p>
              <p 
                className="text-base md:text-lg leading-relaxed"
                style={{ color: colors.primaria }}
              >
                Nós somos a <strong>Primeira Troca & Cia</strong>, responsáveis pelo tratamento e pela segurança dos dados fornecidos em nosso site e demais canais oficiais.
              </p>
            </div>

            {/* Seção 1: Coleta de Informações */}
            <div className="bg-white rounded-lg shadow-md p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${colors.secundaria}20` }}
                >
                  <Eye className="h-6 w-6" style={{ color: colors.secundaria }} />
                </div>
                <h2 
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: colors.primaria }}
                >
                  1. Coleta de Informações
                </h2>
              </div>
              <p 
                className="text-base md:text-lg leading-relaxed mb-6"
                style={{ color: colors.neutraMedia }}
              >
                Durante sua navegação e utilização de nossos serviços, algumas informações são coletadas para aprimorar sua experiência, garantir segurança e viabilizar funcionalidades da nossa plataforma.
              </p>

              <div className="space-y-6">
                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    1.1. Dados fornecidos diretamente pelo cliente:
                  </h3>
                  <p 
                    className="text-base leading-relaxed mb-3"
                    style={{ color: colors.neutraMedia }}
                  >
                    No momento do cadastro ou ao realizar uma compra, podemos coletar:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li style={{ color: colors.neutraMedia }}>Nome completo</li>
                    <li style={{ color: colors.neutraMedia }}>CPF</li>
                    <li style={{ color: colors.neutraMedia }}>Endereço de e-mail</li>
                    <li style={{ color: colors.neutraMedia }}>Número de telefone/celular</li>
                    <li style={{ color: colors.neutraMedia }}>Data de nascimento</li>
                    <li style={{ color: colors.neutraMedia }}>Endereço completo para entrega e cobrança</li>
                  </ul>
                </div>

                <div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ color: colors.primaria }}
                  >
                    1.2. Dados coletados automaticamente:
                  </h3>
                  <p 
                    className="text-base leading-relaxed mb-3"
                    style={{ color: colors.neutraMedia }}
                  >
                    Utilizamos cookies e tecnologias de monitoramento para melhorar sua experiência. Esses dados auxiliam em:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li style={{ color: colors.neutraMedia }}>Métricas de acesso e navegação</li>
                    <li style={{ color: colors.neutraMedia }}>Identificação de preferências</li>
                    <li style={{ color: colors.neutraMedia }}>Análise de tráfego</li>
                    <li style={{ color: colors.neutraMedia }}>Funcionamento correto do site</li>
                  </ul>
                  <p 
                    className="text-base leading-relaxed mt-4"
                    style={{ color: colors.neutraMedia }}
                  >
                    Você pode gerenciar a aceitação de cookies diretamente no seu navegador.
                  </p>
                </div>
              </div>
            </div>

            {/* Seção 2: Uso das Informações */}
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
                  2. Uso das Informações
                </h2>
              </div>
              <p 
                className="text-base md:text-lg leading-relaxed mb-6"
                style={{ color: colors.neutraMedia }}
              >
                Os dados coletados são utilizados para proporcionar uma experiência mais rápida, segura e personalizada. Entre as finalidades, destacamos:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-6">
                <li style={{ color: colors.neutraMedia }}>Processamento de compras e pedidos</li>
                <li style={{ color: colors.neutraMedia }}>Envio de informações sobre seu pedido</li>
                <li style={{ color: colors.neutraMedia }}>Envio de ofertas, promoções e avisos importantes (caso autorizado)</li>
                <li style={{ color: colors.neutraMedia }}>Aperfeiçoamento do site e das nossas campanhas</li>
                <li style={{ color: colors.neutraMedia }}>Estudos internos sobre comportamento de navegação</li>
              </ul>
              <p 
                className="text-base leading-relaxed mb-3"
                style={{ color: colors.neutraMedia }}
              >
                Também podemos compartilhar informações pessoais com prestadores de serviços necessários ao funcionamento da loja, como:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li style={{ color: colors.neutraMedia }}>Gateways de pagamento</li>
                <li style={{ color: colors.neutraMedia }}>Transportadoras</li>
                <li style={{ color: colors.neutraMedia }}>Empresas de marketing e comunicação</li>
                <li style={{ color: colors.neutraMedia }}>Plataformas de atendimento e suporte</li>
              </ul>
              <p 
                className="text-base leading-relaxed mt-4"
                style={{ color: colors.neutraMedia }}
              >
                Todos esses parceiros seguem rigorosos padrões de sigilo e conformidade com a LGPD.
              </p>
            </div>

            {/* Seção 3: Segurança dos Dados */}
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
                  3. Segurança dos Dados
                </h2>
              </div>
              <p 
                className="text-base md:text-lg leading-relaxed"
                style={{ color: colors.neutraMedia }}
              >
                A Primeira Troca & Cia utiliza padrões avançados de segurança e mantém todos os dados armazenados em servidores protegidos e de acesso restrito.
              </p>
              <p 
                className="text-base md:text-lg leading-relaxed mt-4"
                style={{ color: colors.neutraMedia }}
              >
                Somente pessoas autorizadas podem acessar as informações e apenas para fins legítimos e necessários ao funcionamento dos serviços. Qualquer uso indevido é expressamente proibido.
              </p>
            </div>

            {/* Seção 4: Cookies */}
            <div className="bg-white rounded-lg shadow-md p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${colors.secundaria}20` }}
                >
                  <Eye className="h-6 w-6" style={{ color: colors.secundaria }} />
                </div>
                <h2 
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: colors.primaria }}
                >
                  4. Cookies e Tecnologias de Monitoramento
                </h2>
              </div>
              <p 
                className="text-base md:text-lg leading-relaxed mb-4"
                style={{ color: colors.neutraMedia }}
              >
                Os cookies são arquivos instalados no seu dispositivo para permitir uma navegação mais eficiente e personalizada.
              </p>
              <p 
                className="text-base leading-relaxed mb-3"
                style={{ color: colors.neutraMedia }}
              >
                Eles são usados para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li style={{ color: colors.neutraMedia }}>Lembrar preferências de acesso</li>
                <li style={{ color: colors.neutraMedia }}>Melhorar o desempenho do site</li>
                <li style={{ color: colors.neutraMedia }}>Analisar comportamento e tráfego</li>
              </ul>
              <p 
                className="text-base leading-relaxed"
                style={{ color: colors.neutraMedia }}
              >
                Nenhum cookie dá acesso a informações pessoais além do que você mesmo escolhe fornecer.
              </p>
              <p 
                className="text-base leading-relaxed mt-4"
                style={{ color: colors.neutraMedia }}
              >
                Você pode desativá-los nas configurações do navegador, caso deseje.
              </p>
            </div>

            {/* Seção 5: Direitos do Titular */}
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
                  5. Seus Direitos como Titular dos Dados
                </h2>
              </div>
              <p 
                className="text-base md:text-lg leading-relaxed mb-4"
                style={{ color: colors.neutraMedia }}
              >
                De acordo com a LGPD, você possui diversos direitos relacionados aos seus dados pessoais, incluindo:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li style={{ color: colors.neutraMedia }}>Acesso aos seus dados</li>
                <li style={{ color: colors.neutraMedia }}>Correção de dados incorretos, incompletos ou desatualizados</li>
                <li style={{ color: colors.neutraMedia }}>Solicitação de exclusão de dados desnecessários ou tratados sem conformidade</li>
                <li style={{ color: colors.neutraMedia }}>Confirmação da existência de tratamento</li>
                <li style={{ color: colors.neutraMedia }}>Informação sobre com quem os dados são compartilhados</li>
                <li style={{ color: colors.neutraMedia }}>Revogação de consentimento</li>
                <li style={{ color: colors.neutraMedia }}>Solicitação de portabilidade dos dados (quando aplicável)</li>
              </ul>
              <p 
                className="text-base leading-relaxed"
                style={{ color: colors.neutraMedia }}
              >
                Todas as solicitações serão atendidas gratuitamente, mediante verificação de identidade.
              </p>
            </div>

            {/* Seção 6: Exclusão de Dados */}
            <div className="bg-white rounded-lg shadow-md p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${colors.secundaria}20` }}
                >
                  <Trash2 className="h-6 w-6" style={{ color: colors.secundaria }} />
                </div>
                <h2 
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: colors.primaria }}
                >
                  6. Exclusão de Dados Pessoais
                </h2>
              </div>
              <p 
                className="text-base md:text-lg leading-relaxed mb-4"
                style={{ color: colors.neutraMedia }}
              >
                Caso deseje excluir sua conta ou remover informações específicas, você pode solicitar a exclusão diretamente pelo nosso canal de atendimento.
              </p>
              <p 
                className="text-base md:text-lg leading-relaxed"
                style={{ color: colors.neutraMedia }}
              >
                Você também pode cancelar o recebimento de e-mails promocionais clicando no link "cancelar inscrição" que acompanha cada e-mail enviado.
              </p>
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
                Dúvidas ou Solicitações?
              </h2>
              <p 
                className="text-base md:text-lg leading-relaxed mb-4"
                style={{ color: colors.neutraMedia }}
              >
                Para exercer seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade, entre em contato conosco através dos nossos canais oficiais de atendimento.
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


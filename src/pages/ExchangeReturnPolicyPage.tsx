import { FileText } from 'lucide-react';

export function ExchangeReturnPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
            <FileText className="h-8 w-8 text-sky-600" />
          </div>
        </div>
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          Política de Troca e Devolução
        </h1>
        <p className="text-lg text-gray-600">
          Conheça nossos termos para trocas e devoluções
        </p>
      </div>

      <div className="space-y-8 rounded-2xl bg-white p-8 shadow-md">
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Prazo para Troca ou Devolução
          </h2>
          <p className="mb-4 text-gray-700 leading-relaxed">
            Você tem até <strong>7 (sete) dias corridos</strong>, contados a partir da data de recebimento do produto, para solicitar a troca ou devolução, conforme previsto no Código de Defesa do Consumidor.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Condições para Troca ou Devolução
          </h2>
          <ul className="mb-4 space-y-2 text-gray-700 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="mt-1 text-sky-600">•</span>
              <span>O produto deve estar em sua embalagem original, sem uso e sem avarias;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-sky-600">•</span>
              <span>As etiquetas devem estar intactas e presas ao produto;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-sky-600">•</span>
              <span>O produto não pode apresentar sinais de uso, manchas, odores ou danos;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-sky-600">•</span>
              <span>O produto deve ser devolvido com todos os acessórios e brindes que acompanhavam o pedido original.</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Como Solicitar Troca ou Devolução
          </h2>
          <ol className="mb-4 space-y-3 text-gray-700 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-sky-600">1.</span>
              <span>Acesse sua conta e vá até a seção "Meus Pedidos";</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-sky-600">2.</span>
              <span>Localize o pedido que deseja trocar ou devolver;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-sky-600">3.</span>
              <span>Clique em "Solicitar Troca/Devolução" e preencha o formulário;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-sky-600">4.</span>
              <span>Nossa equipe entrará em contato em até 48 horas para orientar sobre o processo;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-sky-600">5.</span>
              <span>Após a aprovação, você receberá um código de postagem para envio do produto.</span>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Custos de Envio
          </h2>
          <p className="mb-4 text-gray-700 leading-relaxed">
            Em caso de <strong>defeito do produto</strong> ou <strong>erro no envio</strong> (produto diferente, tamanho errado, etc.), os custos de envio para devolução são por nossa conta.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Em caso de <strong>desistência da compra</strong> ou <strong>troca por outro produto</strong>, os custos de envio são de responsabilidade do cliente, exceto quando o valor do frete já foi pago no pedido original.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Reembolso
          </h2>
          <p className="mb-4 text-gray-700 leading-relaxed">
            O reembolso será processado na mesma forma de pagamento utilizada na compra:
          </p>
          <ul className="mb-4 space-y-2 text-gray-700 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="mt-1 text-sky-600">•</span>
              <span><strong>Cartão de Crédito:</strong> O estorno será processado em até 2 faturas, conforme política da administradora do cartão;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-sky-600">•</span>
              <span><strong>PIX:</strong> O reembolso será processado em até 5 dias úteis;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-sky-600">•</span>
              <span><strong>Boleto:</strong> O reembolso será processado em até 10 dias úteis.</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Produtos Não Passíveis de Troca ou Devolução
          </h2>
          <ul className="mb-4 space-y-2 text-gray-700 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="mt-1 text-sky-600">•</span>
              <span>Produtos personalizados ou sob medida;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-sky-600">•</span>
              <span>Produtos íntimos (sem proteção adequada);</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-sky-600">•</span>
              <span>Produtos que foram utilizados ou danificados pelo cliente;</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-sky-600">•</span>
              <span>Produtos sem embalagem original ou etiquetas.</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            Dúvidas?
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Se você tiver alguma dúvida sobre nossa política de troca e devolução, entre em contato conosco através do nosso{' '}
            <a href="/tickets" className="font-semibold text-sky-600 hover:underline">
              sistema de suporte
            </a>
            {' '}ou pelo e-mail{' '}
            <a href="mailto:contato@primeiratrocaecia.com.br" className="font-semibold text-sky-600 hover:underline">
              contato@primeiratrocaecia.com.br
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}


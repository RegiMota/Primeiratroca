import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Search, HelpCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { faqAPI } from '../lib/api';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  helpfulCount: number;
  notHelpfulCount: number;
}

const categoryConfig: Record<string, { label: string }> = {
  general: { label: 'Geral' },
  orders: { label: 'Pedidos' },
  payments: { label: 'Pagamentos' },
  shipping: { label: 'Frete e Entrega' },
  products: { label: 'Produtos' },
  returns: { label: 'Trocas e Devoluções' },
};

export function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [submittedFeedback, setSubmittedFeedback] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadCategories();
    loadFAQs();
  }, [categoryFilter, searchQuery]);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const params: FAQSearchParams = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await faqAPI.getAll(params);
      setFaqs(data);
    } catch (error: any) {
      console.error('Error loading FAQs:', error);
      toast.error('Erro ao carregar FAQs');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await faqAPI.getCategories();
      setCategories(data);
    } catch (error: any) {
      console.error('Error loading categories:', error);
    }
  };

  const handleFeedback = async (faqId: number, helpful: boolean) => {
    if (submittedFeedback.has(faqId)) {
      toast.info('Você já enviou feedback para esta pergunta');
      return;
    }

    try {
      await faqAPI.submitFeedback(faqId, helpful);
      setSubmittedFeedback(new Set([...submittedFeedback, faqId]));

      // Atualizar contador local
      setFaqs((prev) =>
        prev.map((faq) =>
          faq.id === faqId
            ? {
                ...faq,
                helpfulCount: helpful ? faq.helpfulCount + 1 : faq.helpfulCount,
                notHelpfulCount: !helpful ? faq.notHelpfulCount + 1 : faq.notHelpfulCount,
              }
            : faq
        )
      );

      toast.success('Obrigado pelo seu feedback!');
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast.error('Erro ao enviar feedback');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Perguntas Frequentes</h1>
        <p className="mt-2 text-gray-600">
          Encontre respostas para as dúvidas mais comuns sobre nossos produtos e serviços
        </p>
      </div>

      {/* Busca e Filtros */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar perguntas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-48">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.category} value={cat.category}>
                  {categoryConfig[cat.category]?.label || cat.category} ({cat.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de FAQs */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando perguntas...</p>
        </div>
      ) : faqs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Nenhuma pergunta encontrada
            </h3>
            <p className="mt-2 text-gray-600">
              {searchQuery || categoryFilter !== 'all'
                ? 'Tente ajustar sua busca ou filtros.'
                : 'Não há perguntas frequentes disponíveis no momento.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={`faq-${faq.id}`} className="border-none">
              <Card>
                <CardHeader className="pb-3">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-start gap-4 text-left">
                      <HelpCircle className="mt-1 h-5 w-5 flex-shrink-0 text-blue-500" />
                      <div className="flex-1">
                        <CardTitle className="text-lg">{faq.question}</CardTitle>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline">
                            {categoryConfig[faq.category]?.label || faq.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                </CardHeader>
                <AccordionContent>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-700 whitespace-pre-line">{faq.answer}</p>
                      <div className="flex items-center gap-4 border-t pt-4">
                        <p className="text-sm text-gray-500">Esta resposta foi útil?</p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFeedback(faq.id, true)}
                            disabled={submittedFeedback.has(faq.id)}
                          >
                            <ThumbsUp className="mr-1 h-4 w-4" />
                            Sim ({faq.helpfulCount})
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFeedback(faq.id, false)}
                            disabled={submittedFeedback.has(faq.id)}
                          >
                            <ThumbsDown className="mr-1 h-4 w-4" />
                            Não ({faq.notHelpfulCount})
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}


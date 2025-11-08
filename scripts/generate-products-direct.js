// Script para gerar 100 produtos aleatórios DIRETAMENTE no banco
// Versão 2.0 - Geração direta via Prisma (evita rate limiting)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Dados aleatórios para geração
const nomesProdutos = [
  'Vestido', 'Blusa', 'Calça', 'Short', 'Saia', 'Camiseta', 'Conjunto', 'Body',
  'Macacão', 'Jardineira', 'Kit', 'Roupa Intima', 'Meia', 'Tênis', 'Sandália',
  'Bermuda', 'Legging', 'Pijama', 'Abrigo', 'Casaco', 'Blazer', 'Cardigã',
  'Sapato', 'Chinelo', 'Bolsa', 'Mochila', 'Boné', 'Touca', 'Luvas', 'Cinto'
];

const cores = [
  'Azul', 'Rosa', 'Branco', 'Preto', 'Vermelho', 'Amarelo', 'Verde', 'Roxo',
  'Laranja', 'Cinza', 'Bege', 'Marrom', 'Coral', 'Turquesa', 'Lilás', 'Dourado',
  'Prata', 'Estampado', 'Listrado', 'Florido'
];

const tamanhos = ['P', 'M', 'G', 'GG', 'PP', 'RN'];

const descricoes = [
  'Perfeito para o dia a dia com conforto e estilo.',
  'Confeccionado com tecido de alta qualidade e maciez.',
  'Ideal para brincadeiras e atividades ao ar livre.',
  'Design moderno e cores vibrantes que encantam.',
  'Composição suave e delicada para peles sensíveis.',
  'Versátil e prático, perfeito para qualquer ocasião.',
  'Estilo único e charmoso que combina com tudo.',
  'Alta durabilidade e resistência para o dia a dia.',
  'Cores alegres e estampas divertidas para os pequenos.',
  'Conforto garantido com tecidos respiráveis.',
  'Corte especial para melhor ajuste e mobilidade.',
  'Detalhes cuidadosos que fazem toda a diferença.',
  'Produzido com materiais sustentáveis e seguros.',
  'Ideal para presentear com qualidade e carinho.',
  'Combinação perfeita de estilo e funcionalidade.'
];

const imagensAleatorias = [
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
  'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400',
  'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400',
  'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400',
  'https://images.unsplash.com/photo-1506629905644-7e3ebf3e1d3c?w=400',
  'https://images.unsplash.com/photo-1503341338985-b0475e8d1d3d?w=400',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
  'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400',
  'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400',
  'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400'
];

// Função para gerar número aleatório
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Função para selecionar item aleatório de array
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Função para selecionar múltiplos itens aleatórios
function randomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Função para gerar preço aleatório
function randomPrice() {
  const preco = randomInt(1990, 19990) / 100; // Entre R$ 19,90 e R$ 199,90
  return parseFloat(preco.toFixed(2));
}

// Função para gerar preço original (com desconto)
function randomOriginalPrice(price) {
  if (Math.random() > 0.5) { // 50% de chance de ter desconto
    const desconto = randomInt(10, 40); // 10% a 40% de desconto
    const original = price / (1 - desconto / 100);
    return parseFloat(original.toFixed(2));
  }
  return null;
}

// Função para gerar nome de produto
function generateProductName() {
  const nome = randomItem(nomesProdutos);
  const cor = randomItem(cores);
  const adjetivos = ['Infantil', 'Baby', 'Kids', 'Criança', 'Menina', 'Menino', 'Bebê'];
  const adjetivo = randomItem(adjetivos);
  
  return `${nome} ${adjetivo} ${cor}`;
}

// Função para gerar descrição
function generateDescription() {
  const descricaoBase = randomItem(descricoes);
  const detalhes = [
    'Tecido 100% algodão.',
    'Fácil de lavar e de passar.',
    'Não encolhe e não desbota.',
    'Composição: 80% algodão, 20% poliéster.',
    'Tecido antialérgico e hipoalergênico.',
    'Confortável e resistente.',
    'Perfeito para todas as estações.',
    'Tamanhos disponíveis conforme tabela.',
    'Cores vibrantes e duradouras.',
    'Produto nacional com qualidade garantida.'
  ];
  
  const detalhesAleatorios = randomItems(detalhes, randomInt(2, 4));
  return `${descricaoBase} ${detalhesAleatorios.join(' ')}`;
}

// Função principal
async function main() {
  console.log('🚀 Iniciando geração de 100 produtos aleatórios (direto no banco)...\n');

  try {
    // Buscar categorias
    console.log('📋 Buscando categorias...');
    const categoriasDisponiveis = await prisma.category.findMany();
    
    if (categoriasDisponiveis.length === 0) {
      console.error('❌ Nenhuma categoria encontrada! Crie categorias primeiro.');
      process.exit(1);
    }

    console.log(`✅ Encontradas ${categoriasDisponiveis.length} categorias\n`);

    // Criar produtos
    const produtosCriados = [];
    const produtosErro = [];
    
    for (let i = 0; i < 100; i++) {
      const categoriaAleatoria = randomItem(categoriasDisponiveis);
      const nome = generateProductName();
      const descricao = generateDescription();
      const preco = randomPrice();
      const precoOriginal = randomOriginalPrice(preco);
      const tamanhosSelecionados = randomItems(tamanhos, randomInt(2, 5));
      const coresSelecionadas = randomItems(cores, randomInt(2, 4));
      const estoque = randomInt(10, 100);
      const featured = Math.random() > 0.8; // 20% chance de ser destaque
      const imagem = randomItem(imagensAleatorias);

      try {
        const produto = await prisma.product.create({
          data: {
            name: nome,
            description: descricao,
            price: preco,
            originalPrice: precoOriginal,
            categoryId: categoriaAleatoria.id,
            image: imagem,
            stock: estoque,
            sizes: JSON.stringify(tamanhosSelecionados),
            colors: JSON.stringify(coresSelecionadas),
            featured: featured
          }
        });
        
        produtosCriados.push(produto);
        console.log(`✅ [${i + 1}/100] Produto criado: ${nome} - R$ ${preco.toFixed(2)}`);
      } catch (error) {
        console.error(`❌ [${i + 1}/100] Erro ao criar produto "${nome}":`, error.message);
        produtosErro.push({ index: i + 1, error: error.message });
      }
    }

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA GERAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Produtos criados com sucesso: ${produtosCriados.length}`);
    console.log(`❌ Produtos com erro: ${produtosErro.length}`);
    console.log('='.repeat(60));

    if (produtosErro.length > 0) {
      console.log('\n⚠️ Produtos com erro:');
      produtosErro.forEach((item, idx) => {
        console.log(`  ${idx + 1}. Produto #${item.index}: ${item.error}`);
      });
    }

    console.log('\n✨ Processo concluído!');
  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
main();


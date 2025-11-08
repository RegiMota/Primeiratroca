// Script para gerar 100 produtos aleatórios
// Versão 2.0 - Geração de dados de teste

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@primeiratroca.com.br';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
let ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// Dados aleatórios para geração
const categorias = [];
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

const tamanhos = ['P', 'M', 'G', 'GG', 'PP', 'RN', 'P', 'M', 'G'];

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

// Função para criar produto
async function createProduct(categoryId, index) {
  const nome = generateProductName();
  const descricao = generateDescription();
  const preco = randomPrice();
  const precoOriginal = randomOriginalPrice(preco);
  const tamanhosSelecionados = randomItems(tamanhos, randomInt(2, 5));
  const coresSelecionadas = randomItems(cores, randomInt(2, 4));
  const estoque = randomInt(10, 100);
  const featured = Math.random() > 0.8; // 20% chance de ser destaque
  const imagem = randomItem(imagensAleatorias);

  const productData = {
    name: nome,
    description: descricao,
    price: preco,
    originalPrice: precoOriginal,
    categoryId: categoryId,
    image: imagem,
    stock: estoque,
    sizes: tamanhosSelecionados,
    colors: coresSelecionadas,
    featured: featured
  };

  try {
    const response = await axios.post(`${API_URL}/admin/products`, productData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ [${index + 1}/100] Produto criado: ${nome} - R$ ${preco.toFixed(2)}`);
    return response.data;
  } catch (error) {
    console.error(`❌ [${index + 1}/100] Erro ao criar produto "${nome}":`, error.response?.data || error.message);
    throw error;
  }
}

// Função para fazer login e obter token
async function login() {
  try {
    console.log('🔐 Fazendo login como admin...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (response.data.token) {
      ADMIN_TOKEN = response.data.token;
      console.log('✅ Login realizado com sucesso!\n');
      return true;
    } else {
      console.error('❌ Token não recebido no login');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.response?.data?.error || error.message);
    if (error.response?.status === 401) {
      console.error('\n💡 Verifique se as credenciais estão corretas:');
      console.error(`   Email: ${ADMIN_EMAIL}`);
      console.error(`   Senha: ${ADMIN_PASSWORD}`);
      console.error('\n   Ou defina via variáveis de ambiente:');
      console.error('   ADMIN_EMAIL=seu_email');
      console.error('   ADMIN_PASSWORD=sua_senha');
    }
    return false;
  }
}

// Função principal
async function main() {
  const START_FROM = parseInt(process.env.START_FROM || '47'); // Começar do produto 47
  const TOTAL = parseInt(process.env.TOTAL || '100'); // Total de produtos
  const PRODUCTS_TO_CREATE = TOTAL - START_FROM + 1; // Produtos restantes
  
  console.log(`🚀 Criando ${PRODUCTS_TO_CREATE} produtos (${START_FROM} a ${TOTAL})...\n`);

  // Se não há token, fazer login
  if (!ADMIN_TOKEN) {
    let loginSuccess = false;
    let tentativas = 0;
    const maxTentativas = 3;
    
    while (!loginSuccess && tentativas < maxTentativas) {
      loginSuccess = await login();
      if (!loginSuccess) {
        tentativas++;
        if (tentativas < maxTentativas) {
          console.log(`⏳ Aguardando 30 segundos antes de tentar novamente... (tentativa ${tentativas + 1}/${maxTentativas})`);
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      }
    }
    
    if (!loginSuccess) {
      console.error('\n❌ Não foi possível fazer login após várias tentativas.');
      console.error('💡 Aguarde alguns minutos e tente novamente, ou ajuste o rate limiting.');
      process.exit(1);
    }
  }

  try {
    // Buscar categorias
    console.log('📋 Buscando categorias...');
    const categoriesResponse = await axios.get(`${API_URL}/categories`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    
    const categoriasDisponiveis = categoriesResponse.data;
    
    if (categoriasDisponiveis.length === 0) {
      console.error('❌ Nenhuma categoria encontrada! Crie categorias primeiro.');
      process.exit(1);
    }

    console.log(`✅ Encontradas ${categoriasDisponiveis.length} categorias\n`);

    // Criar produtos
    const produtosCriados = [];
    const produtosErro = [];
    const START_FROM = parseInt(process.env.START_FROM || '47');
    const TOTAL = parseInt(process.env.TOTAL || '100');
    
    for (let i = START_FROM - 1; i < TOTAL; i++) {
      const categoriaAleatoria = randomItem(categoriasDisponiveis);
      
      try {
        const produto = await createProduct(categoriaAleatoria.id, i);
        produtosCriados.push(produto);
        
        // Delay maior para evitar rate limiting (2 segundos entre cada)
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        // Se for rate limiting, esperar um pouco mais
        if (error.response?.status === 429) {
          const retryAfter = error.response?.data?.retryAfter || 60;
          console.log(`⏳ Rate limit atingido no produto ${i + 1}. Aguardando ${retryAfter} segundos...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          // Tentar novamente
          try {
            const produto = await createProduct(categoriaAleatoria.id, i);
            produtosCriados.push(produto);
            console.log(`✅ [${i + 1}/${TOTAL}] Produto criado após espera`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (retryError) {
            produtosErro.push({ index: i + 1, error: retryError });
            // Mesmo com erro, aguardar antes do próximo
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } else {
          produtosErro.push({ index: i + 1, error });
          // Mesmo com erro, aguardar antes do próximo
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA GERAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Produtos criados com sucesso: ${produtosCriados.length}`);
    console.log(`❌ Produtos com erro: ${produtosErro.length}`);
    console.log(`📦 Total esperado: ${TOTAL - START_FROM + 1} produtos (${START_FROM} a ${TOTAL})`);
    console.log('='.repeat(60));

    if (produtosErro.length > 0) {
      console.log('\n⚠️ Produtos com erro:');
      produtosErro.forEach((item, idx) => {
        console.log(`  ${idx + 1}. Produto #${item.index}`);
      });
    }

    console.log('\n✨ Processo concluído!');
  } catch (error) {
    console.error('\n❌ Erro fatal:', error.message);
    if (error.response) {
      console.error('Resposta do servidor:', error.response.data);
    }
    process.exit(1);
  }
}

// Executar
main();


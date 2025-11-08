// Script para criar categorias padrão
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const categoriasPadrao = [
  { name: 'Roupas', slug: 'roupas', description: 'Roupas infantis diversas' },
  { name: 'Calçados', slug: 'calcados', description: 'Calçados para crianças' },
  { name: 'Acessórios', slug: 'acessorios', description: 'Acessórios infantis' },
  { name: 'Bebês', slug: 'bebes', description: 'Produtos para bebês' },
  { name: 'Meninas', slug: 'meninas', description: 'Roupas para meninas' },
  { name: 'Meninos', slug: 'meninos', description: 'Roupas para meninos' },
  { name: 'Unissex', slug: 'unissex', description: 'Produtos unissex' },
  { name: 'Kits', slug: 'kits', description: 'Kits de produtos' },
];

async function createCategories() {
  try {
    console.log('🔍 Verificando categorias existentes...\n');
    
    const categoriasExistentes = await prisma.category.findMany();
    
    if (categoriasExistentes.length > 0) {
      console.log(`✅ Já existem ${categoriasExistentes.length} categorias no banco:`);
      categoriasExistentes.forEach((cat, idx) => {
        console.log(`   ${idx + 1}. ${cat.name} (${cat.slug})`);
      });
      console.log('\n💡 Usando categorias existentes para criar produtos.');
      await prisma.$disconnect();
      return categoriasExistentes;
    }
    
    console.log('📝 Criando categorias padrão...\n');
    
    const categoriasCriadas = [];
    
    for (const categoria of categoriasPadrao) {
      try {
        const cat = await prisma.category.create({
          data: categoria
        });
        categoriasCriadas.push(cat);
        console.log(`✅ Categoria criada: ${cat.name} (${cat.slug})`);
      } catch (error) {
        if (error.code === 'P2002') {
          // Categoria já existe
          const existente = await prisma.category.findUnique({
            where: { slug: categoria.slug }
          });
          if (existente) {
            categoriasCriadas.push(existente);
            console.log(`ℹ️  Categoria já existe: ${categoria.name} (${categoria.slug})`);
          }
        } else {
          console.error(`❌ Erro ao criar categoria "${categoria.name}":`, error.message);
        }
      }
    }
    
    console.log(`\n✅ Total de ${categoriasCriadas.length} categorias disponíveis!`);
    
    await prisma.$disconnect();
    return categoriasCriadas;
  } catch (error) {
    console.error('\n❌ Erro ao criar categorias:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createCategories();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@primeiratroca.com.br' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@primeiratroca.com.br',
      password: hashedPassword,
      isAdmin: true,
    },
  });

  // Create categories
  const categories = [
    { name: 'Dresses', slug: 'dresses', description: 'Vestidos para crianças' },
    { name: 'Tops', slug: 'tops', description: 'Blusas e camisetas' },
    { name: 'Bottoms', slug: 'bottoms', description: 'Calças e shorts' },
    { name: 'Shoes', slug: 'shoes', description: 'Calçados' },
    { name: 'Outerwear', slug: 'outerwear', description: 'Casacos e jaquetas' },
    { name: 'Accessories', slug: 'accessories', description: 'Acessórios' },
    { name: 'Swimwear', slug: 'swimwear', description: 'Roupas de banho' },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories.push(category);
  }

  // Create products
  const products = [
    {
      name: 'Vestido Listrado Arco-íris',
      description: 'Lindo vestido listrado em arco-íris perfeito para dias de verão. Feito com algodão macio e respirável para máximo conforto.',
      price: 45.99,
      originalPrice: 59.99,
      image: 'https://images.unsplash.com/photo-1759313560222-b73784cd42f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMGRyZXNzJTIwZmFzaGlvbnxlbnwxfHx8fDE3NjIwNDExMDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Dresses',
      sizes: ['2T', '3T', '4T', '5T', '6T'],
      colors: ['Multi-color'],
      featured: true,
      stock: 25,
    },
    {
      name: 'Camiseta Estilosa',
      description: 'Camiseta estilosa com designs divertidos que as crianças adoram. 100% algodão para conforto durante todo o dia.',
      price: 24.99,
      originalPrice: undefined,
      image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMHRzaGlydHxlbnwxfHx8fDE3NjIwNDExMDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Tops',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Branco', 'Azul', 'Rosa'],
      featured: true,
      stock: 40,
    },
    {
      name: 'Tênis Colorido para Crianças',
      description: 'Tênis vibrante e confortável perfeito para crianças ativas. Solado antiderrapante para segurança.',
      price: 54.99,
      originalPrice: 69.99,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMHNob2VzfGVufDF8fHx8fDE3NjIwNDExMDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Shoes',
      sizes: ['10', '11', '12', '13', '1'],
      colors: ['Azul', 'Rosa', 'Amarelo'],
      featured: true,
      stock: 30,
    },
    {
      name: 'Casaco de Inverno Aconchegante',
      description: 'Casaco quente e estiloso para manter seus pequenos aquecidos durante os dias frios. Camada externa à prova d\'água.',
      price: 79.99,
      originalPrice: undefined,
      image: 'https://images.unsplash.com/photo-1520242270491-c5f52c84c0c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMGphY2tldHxlbnwxfHx8fDE3NjIwNDExMDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Outerwear',
      sizes: ['2T', '3T', '4T', '5T', '6T'],
      colors: ['Azul Marinho', 'Vermelho', 'Verde'],
      featured: false,
      stock: 20,
    },
    {
      name: 'Jeans Confortável',
      description: 'Jeans clássico com elasticidade para conforto extra. Perfeito para uso diário.',
      price: 34.99,
      originalPrice: undefined,
      image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMHBhbnRzfGVufDF8fHx8fDE3NjIwNDExMDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      category: 'Bottoms',
      sizes: ['2T', '3T', '4T', '5T', '6T'],
      colors: ['Azul', 'Preto'],
      featured: false,
      stock: 35,
    },
  ];

  for (const product of products) {
    const category = createdCategories.find((c) => c.name === product.category);
    if (category) {
      // Check if product exists by name
      const existing = await prisma.product.findFirst({
        where: { name: product.name },
      });

      if (!existing) {
        await prisma.product.create({
          data: {
            name: product.name,
            description: product.description,
            price: product.price,
            originalPrice: product.originalPrice,
            image: product.image,
            categoryId: category.id,
            sizes: JSON.stringify(product.sizes),
            colors: JSON.stringify(product.colors),
            featured: product.featured,
            stock: product.stock,
          },
        });
      }
    }
  }

  console.log('✅ Seeding completed!');
  console.log(`   Admin user: admin@primeiratroca.com.br / admin`);
  console.log(`   Created ${createdCategories.length} categories`);
  console.log(`   Created ${products.length} products`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


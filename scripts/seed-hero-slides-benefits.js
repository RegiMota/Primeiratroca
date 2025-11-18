// Script para popular dados iniciais de Hero Slides e Benefit Cards
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de conteúdo...');

  // Verificar se já existem slides
  const existingSlides = await prisma.heroSlide.count();
  if (existingSlides === 0) {
    console.log('📸 Criando slides do carrossel...');
    await prisma.heroSlide.createMany({
      data: [
        {
          title: 'Macacão Peluciado',
          subtitle: 'FLEECE',
          description: 'Conforto e qualidade para seu bebê',
          price: '119',
          originalPrice: '149',
          buttonText: 'Compre aqui',
          buttonLink: '/shop?category=body&promo=true',
          mediaUrl: 'https://d3m5ncion0j1nd.cloudfront.net/Custom/Content/Themes/Shared/Videos/Ver%C3%A3o_Desktop.mp4?v=2025-11-05_09-48',
          mediaType: 'video',
          order: 0,
          isActive: true,
        },
        {
          title: 'Body Confortável',
          subtitle: 'SUEDINE',
          description: 'Qualidade premium para seu pequeno',
          price: '89',
          originalPrice: '119',
          buttonText: 'Ver produtos',
          buttonLink: '/shop?category=body',
          mediaType: 'image',
          order: 1,
          isActive: true,
        },
        {
          title: 'Nova Coleção',
          subtitle: 'BABY',
          description: 'As melhores peças para bebês',
          price: '139',
          originalPrice: '179',
          buttonText: 'Explorar',
          buttonLink: '/shop?category=conjuntos',
          mediaType: 'image',
          order: 2,
          isActive: true,
        },
      ],
    });
    console.log('✅ Slides criados com sucesso!');
  } else {
    console.log(`⚠️  Já existem ${existingSlides} slides. Pulando criação.`);
  }

  // Verificar se já existem cards de benefícios
  const existingCards = await prisma.benefitCard.count();
  if (existingCards === 0) {
    console.log('🎁 Criando cards de benefícios...');
    await prisma.benefitCard.createMany({
      data: [
        {
          iconName: 'Send',
          mainText: 'Frete grátis',
          subText: 'Para compras acima de R$ 239',
          order: 0,
          isActive: true,
        },
        {
          iconName: 'RefreshCw',
          mainText: 'Troca grátis',
          subText: 'Na primeira compra',
          order: 1,
          isActive: true,
        },
        {
          iconName: 'CreditCard',
          mainText: 'Parcele sem juros',
          subText: 'Em até 3x',
          order: 2,
          isActive: true,
        },
      ],
    });
    console.log('✅ Cards de benefícios criados com sucesso!');
  } else {
    console.log(`⚠️  Já existem ${existingCards} cards. Pulando criação.`);
  }

  console.log('✨ Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

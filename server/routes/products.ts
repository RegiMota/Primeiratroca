import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all products with advanced search
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      featured, 
      search,
      minPrice,
      maxPrice,
      size,
      color,
      inStock,
      sortBy,
      sortOrder,
      limit,
      offset
    } = req.query;
    
    const limitNum = limit ? parseInt(limit as string) : undefined;
    const offsetNum = offset ? parseInt(offset as string) : 0;

    const where: any = {};

    // Filtro por categoria (usando many-to-many)
    if (category && category !== 'All') {
      // Buscar a categoria pelo slug ou name
      const foundCategory = await prisma.category.findFirst({
        where: {
          OR: [
            { name: category as string },
            { slug: category as string },
          ],
        },
      });
      
      if (foundCategory) {
        // Filtrar produtos que têm esta categoria usando a tabela de junção
        where.categories = {
          some: {
            categoryId: foundCategory.id,
          },
        };
      } else {
        // Se não encontrar a categoria, retornar array vazio
        return res.json({
          products: [],
          total: 0,
          page: 1,
          totalPages: 0,
        });
      }
    }

    // Filtro por featured
    if (featured === 'true') {
      where.featured = true;
    }

    // Filtro por preço mínimo (só aplicar se for maior que 0)
    if (minPrice && parseFloat(minPrice as string) > 0) {
      where.price = {
        ...(where.price || {}),
        gte: parseFloat(minPrice as string),
      };
    }

    // Filtro por preço máximo (só aplicar se for menor que o máximo permitido)
    if (maxPrice && parseFloat(maxPrice as string) < 10000) {
      where.price = {
        ...(where.price || {}),
        lte: parseFloat(maxPrice as string),
      };
    }

    // Filtro por tamanho
    if (size) {
      where.sizes = {
        contains: size as string,
      };
    }

    // Filtro por cor
    if (color) {
      where.colors = {
        contains: color as string,
      };
    }

    // Filtro por estoque
    if (inStock === 'true') {
      where.stock = {
        gt: 0,
      };
    }

    // Busca avançada (combinar com AND para não substituir outros filtros)
    if (search) {
      const searchTerm = (search as string).trim();
      if (searchTerm.length > 0) {
        // Combinar busca com outros filtros usando AND
        // MySQL geralmente já é case-insensitive com collation utf8_general_ci
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { name: { contains: searchTerm } },
              { description: { contains: searchTerm } },
            ],
          },
        ];
      }
    }

    // Ordenação avançada
    const orderBy: any = {};
    const sortByField = sortBy as string || 'createdAt';
    const sortOrderValue = (sortOrder as string)?.toUpperCase() === 'ASC' ? 'asc' : 'desc';

    // Mapear campos de ordenação
    switch (sortByField) {
      case 'price':
        orderBy.price = sortOrderValue;
        break;
      case 'name':
        orderBy.name = sortOrderValue;
        break;
      case 'createdAt':
        orderBy.createdAt = sortOrderValue;
        break;
      case 'featured':
        orderBy.featured = sortOrderValue;
        break;
      default:
        orderBy.createdAt = 'desc';
    }

    // Buscar total de produtos (para paginação)
    const total = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        images: {
          orderBy: [
            { isPrimary: 'desc' },
            { order: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
      orderBy,
      take: limitNum,
      skip: offsetNum,
    });

    // Parse JSON strings and convert Decimal to number
    const formattedProducts = products.map((product) => {
      try {
        // Extrair categorias do relacionamento many-to-many
        const categories = product.categories?.map((pc: any) => pc.category) || [];
        // Manter category para compatibilidade (primeira categoria)
        const category = categories[0] || null;
        
        // Parse sizes e colors com tratamento de erro
        let sizes = [];
        let colors = [];
        try {
          sizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : (product.sizes || []);
        } catch (e) {
          console.warn(`Erro ao parse sizes do produto ${product.id}:`, e);
          sizes = [];
        }
        try {
          colors = typeof product.colors === 'string' ? JSON.parse(product.colors) : (product.colors || []);
        } catch (e) {
          console.warn(`Erro ao parse colors do produto ${product.id}:`, e);
          colors = [];
        }
        
        return {
          ...product,
          price: Number(product.price),
          originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
          sizes,
          colors,
          // Use images array if available, otherwise fallback to image field
          image: product.images && product.images.length > 0 
            ? product.images[0].url 
            : product.image,
          // Manter category para compatibilidade
          category,
          // Incluir categories na resposta
          categories,
        };
      } catch (error) {
        console.error(`Erro ao formatar produto ${product.id}:`, error);
        // Retornar produto com valores padrão em caso de erro
        return {
          ...product,
          price: Number(product.price) || 0,
          originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
          sizes: [],
          colors: [],
          image: product.image || '',
          category: null,
        };
      }
    });

    // Se há paginação, retornar com metadados
    if (limitNum !== undefined) {
      res.json({
        products: formattedProducts,
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total,
      });
    } else {
      // Sem paginação, retornar array direto (compatibilidade)
      res.json(formattedProducts);
    }
  } catch (error: any) {
    console.error('Get products error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Error meta:', error.meta);
    
    // Retornar mais detalhes em desenvolvimento para facilitar debug
    const errorResponse: any = {
      error: 'Erro ao buscar produtos',
    };
    
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
      errorResponse.details = error.message;
      errorResponse.code = error.code;
      if (error.meta) {
        errorResponse.meta = error.meta;
      }
    }
    
    res.status(500).json(errorResponse);
  }
});

// GET best selling products - DEVE VIR ANTES DE /:id
router.get('/best-selling', async (req, res) => {
  try {
    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 8;

    // Buscar produtos mais vendidos usando agregação
    // Primeiro, buscar todos os produtos com suas vendas
    let allProducts;
    try {
      allProducts = await prisma.product.findMany({
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          images: {
            orderBy: [
              { isPrimary: 'desc' },
              { order: 'asc' },
              { createdAt: 'asc' },
            ],
          },
          orderItems: {
            include: {
              order: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
      });
    } catch (dbError: any) {
      console.error('Database error in best-selling:', dbError);
      // Se houver erro na query, tentar buscar sem orderItems
      allProducts = await prisma.product.findMany({
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          images: {
            orderBy: [
              { isPrimary: 'desc' },
              { order: 'asc' },
              { createdAt: 'asc' },
            ],
          },
        },
      });
    }

    // Calcular quantidade total vendida para cada produto
    // Considerar apenas pedidos entregues, enviados, processando ou completados
    const productsWithSales = allProducts.map((product) => {
      // Verificar se há orderItems e se cada item tem order válido
      let totalSold = 0;
      if (product.orderItems && Array.isArray(product.orderItems)) {
        totalSold = product.orderItems
          .filter((item) => item && item.order && item.order.status)
          .filter((item) => 
            ['delivered', 'shipped', 'processing', 'completed'].includes(item.order.status)
          )
          .reduce((sum, item) => sum + (item.quantity || 0), 0);
      }
      
      return {
        ...product,
        totalSold,
      };
    });

    // Ordenar por quantidade vendida (maior para menor)
    productsWithSales.sort((a, b) => b.totalSold - a.totalSold);

    // Pegar apenas os top produtos (que tenham vendas > 0)
    let topProducts = productsWithSales
      .filter((product) => product.totalSold > 0)
      .slice(0, limitNum);

    // Se não houver produtos com vendas, retornar produtos em destaque ou mais recentes
    let finalProducts = topProducts;
    if (finalProducts.length === 0) {
      // Se não houver produtos com vendas, retornar produtos em destaque primeiro
      const featuredProducts = allProducts
        .filter((p) => p.featured)
        .slice(0, limitNum)
        .map((p) => ({ ...p, totalSold: 0 }));
      
      // Se ainda não houver produtos suficientes, adicionar produtos com estoque
      if (featuredProducts.length < limitNum) {
        const remaining = limitNum - featuredProducts.length;
        const productsWithStock = allProducts
          .filter((p) => !p.featured && p.stock > 0)
          .slice(0, remaining)
          .map((p) => ({ ...p, totalSold: 0 }));
        finalProducts = [...featuredProducts, ...productsWithStock];
      } else {
        finalProducts = featuredProducts;
      }
      
      // Se ainda não houver produtos suficientes, adicionar qualquer produto
      if (finalProducts.length < limitNum) {
        const remaining = limitNum - finalProducts.length;
        const anyProducts = allProducts
          .filter((p) => !finalProducts.some((fp) => fp.id === p.id))
          .slice(0, remaining)
          .map((p) => ({ ...p, totalSold: 0 }));
        finalProducts = [...finalProducts, ...anyProducts];
      }
    }

    // Formatar produtos
    const formattedProducts = finalProducts.map((product) => {
      try {
        return {
          ...product,
          price: Number(product.price),
          originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
          sizes: product.sizes ? (typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes) : [],
          colors: product.colors ? (typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors) : [],
          image: product.images && product.images.length > 0
            ? product.images[0].url
            : product.image,
          images: product.images,
          totalSold: product.totalSold || 0,
          orderItems: undefined, // Remover orderItems do response
        };
      } catch (error) {
        console.error(`Error formatting product ${product.id}:`, error);
        // Retornar produto com valores padrão em caso de erro
        return {
          ...product,
          price: Number(product.price) || 0,
          originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
          sizes: [],
          colors: [],
          image: product.image || '',
          images: product.images || [],
          totalSold: product.totalSold || 0,
          orderItems: undefined,
        };
      }
    });

    res.json(formattedProducts);
  } catch (error: any) {
    console.error('Get best selling products error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Erro ao buscar produtos mais vendidos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// GET search suggestions (autocomplete) - DEVE VIR ANTES DE /:id
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;

    // Aceitar busca a partir de 1 caractere para resposta mais rápida
    if (!q || (q as string).trim().length < 1) {
      return res.json([]);
    }

    const searchTerm = (q as string).trim();
    
    // Buscar produtos por nome (MySQL é case-insensitive por padrão)
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
      },
      select: {
        id: true,
        name: true,
        categories: {
          include: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      take: 10,
      orderBy: {
        name: 'asc',
      },
    });

    // Formatar sugestões
    const suggestions = products.map((product) => {
      const categoryName = product.categories?.[0]?.category?.name || '';
      return {
        id: product.id,
        name: product.name,
        category: categoryName,
      };
    });

    res.json(suggestions);
  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({ error: 'Erro ao buscar sugestões' });
  }
});

// Get single product - DEVE VIR POR ÚLTIMO
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        images: {
          orderBy: [
            { isPrimary: 'desc' },
            { order: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Extrair categorias do relacionamento many-to-many
    const categories = product.categories?.map((pc: any) => pc.category) || [];
    const category = categories[0] || null;

    const formattedProduct = {
      ...product,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
      sizes: JSON.parse(product.sizes),
      colors: JSON.parse(product.colors),
      // Use images array if available, otherwise fallback to image field
      image: product.images && product.images.length > 0 
        ? product.images[0].url 
        : product.image,
      // Manter category para compatibilidade
      category,
    };

    res.json(formattedProduct);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

export default router;


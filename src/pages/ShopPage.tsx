import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ProductCard } from '../components/ProductCard';
import { FilterSidebar } from '../components/FilterSidebar';
import { productsAPI, categoriesAPI } from '../lib/api';
import { Product } from '../lib/mockData';
import { ProductSearchParams } from '../types';
import { AnalyticsEvents } from '../lib/analytics';
import { Button } from '../components/ui/button';
import { Filter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../components/ui/pagination';

interface Category {
  id: number;
  name: string;
  slug: string;
}

export function ShopPage() {
  const [location] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // Ler parâmetro 'search' da URL se existir
  const urlParams = new URLSearchParams(window.location.search);
  const initialSearch = urlParams.get('search') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Carregar categorias e extrair tamanhos/cores únicos
  useEffect(() => {
    const loadCategoriesAndOptions = async () => {
      try {
        setLoadingCategories(true);
        const [categoriesData, allProductsData] = await Promise.all([
          categoriesAPI.getAll(),
          productsAPI.getAll({ limit: 1000 }), // Buscar muitos produtos para extrair opções
        ]);
        
        setCategories(categoriesData);
        
        // Extrair tamanhos e cores únicos
        const sizesSet = new Set<string>();
        const colorsSet = new Set<string>();
        
        const productsArray = Array.isArray(allProductsData) ? allProductsData : (allProductsData.products || []);
        
        productsArray.forEach((product: Product) => {
          if (Array.isArray(product.sizes)) {
            product.sizes.forEach((size: string) => sizesSet.add(size));
          }
          if (Array.isArray(product.colors)) {
            product.colors.forEach((color: string) => colorsSet.add(color));
          }
        });
        
        setAvailableSizes(Array.from(sizesSet).sort());
        setAvailableColors(Array.from(colorsSet).sort());
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategoriesAndOptions();
  }, []);

  // Ler parâmetros da URL quando a página carrega
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Ler parâmetro de busca
    const searchParam = urlParams.get('search');
    if (searchParam && searchParam !== searchQuery) {
      setSearchQuery(searchParam);
    }
    
    // Ler parâmetro de categoria
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
      // Verificar se a categoria existe nas categorias carregadas
      // Primeiro tenta encontrar pelo slug, depois pelo nome
      const category = categories.find(c => 
        c.slug.toLowerCase() === categoryParam.toLowerCase() || 
        c.name.toLowerCase() === categoryParam.toLowerCase()
      );
      if (category) {
        // Usar o slug da categoria (o backend agora aceita slug ou name)
        // Isso mantém consistência com a URL
        setSelectedCategory(category.slug);
      } else if (categories.length > 0) {
        // Se as categorias já foram carregadas mas não encontrou, usar o parâmetro diretamente
        // O backend agora aceita tanto slug quanto name
        setSelectedCategory(categoryParam);
      } else {
        // Se as categorias ainda não foram carregadas, usar o parâmetro diretamente
        // O useEffect será executado novamente quando as categorias carregarem
        setSelectedCategory(categoryParam);
      }
    } else {
      // Se não há parâmetro de categoria na URL, resetar para 'All'
      setSelectedCategory('All');
    }
    
    // Ler parâmetro de gênero
    const genderParam = urlParams.get('gender');
    // TODO: Implementar filtro de gênero se necessário
    
    // Ler parâmetro de featured
    const featuredParam = urlParams.get('featured');
    if (featuredParam === 'true') {
      setFeaturedOnly(true);
    }
    
    // Ler parâmetro de new
    const newParam = urlParams.get('new');
    // TODO: Implementar filtro de novidades se necessário
  }, [location, categories]);

  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | 'name' | 'featured'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Resetar para página 1 quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, priceRange, selectedSizes, selectedColors, inStockOnly, featuredOnly, sortBy, sortOrder]);
  
  // Calcular contador de filtros ativos
  const activeFiltersCount = [
    selectedCategory !== 'All' ? 1 : 0,
    priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0,
    selectedSizes.length,
    selectedColors.length,
    inStockOnly ? 1 : 0,
    featuredOnly ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);
  
  // Limpar todos os filtros (incluindo busca)
  const clearFilters = () => {
    setSelectedCategory('All');
    setPriceRange([0, 500]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setInStockOnly(false);
    setFeaturedOnly(false);
    setSearchQuery(''); // Limpar busca também
    setCurrentPage(1);
    // Atualizar URL para remover parâmetros de busca
    const url = new URL(window.location.href);
    url.searchParams.delete('search');
    window.history.replaceState({}, '', url.toString());
  };

  // Handler para mudança de categoria (limpa busca quando categoria é selecionada)
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Limpar busca quando uma categoria é selecionada (mesmo se for 'All')
    setSearchQuery('');
    // Atualizar URL para remover parâmetro de busca e atualizar categoria
    const url = new URL(window.location.href);
    url.searchParams.delete('search');
    if (category !== 'All') {
      url.searchParams.set('category', category);
    } else {
      url.searchParams.delete('category');
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Handler para mudança de outros filtros (limpa busca quando filtros são aplicados)
  const handleFilterChange = () => {
    // Limpar busca quando filtros são aplicados
    if (searchQuery) {
      setSearchQuery('');
      // Atualizar URL para remover parâmetro de busca
      const url = new URL(window.location.href);
      url.searchParams.delete('search');
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * 60;
        const params: ProductSearchParams = {
          limit: 60, // 60 produtos por página
          page: currentPage,
        };
        
        // Filtro por categoria
        if (selectedCategory && selectedCategory !== 'All') {
          // O backend agora aceita tanto slug quanto name
          params.category = selectedCategory;
        }
        
        // Filtro por busca
        if (searchQuery && searchQuery.trim().length > 0) {
          params.search = searchQuery.trim();
        }
        
        // Filtros de preço (só enviar se não for o padrão)
        if (priceRange[0] > 0 || priceRange[1] < 500) {
          params.minPrice = priceRange[0];
          params.maxPrice = priceRange[1];
        }
        
        // Filtro por tamanhos (aplicar se houver selecionados)
        if (selectedSizes.length > 0) {
          // A API aceita apenas um tamanho, então vamos filtrar por múltiplos tamanhos
          // Por enquanto, vamos usar o primeiro tamanho selecionado
          // NOTA: Backend pode ser melhorado no futuro para suportar múltiplos tamanhos
          params.size = selectedSizes[0];
        }
        
        // Filtro por cores (aplicar se houver selecionadas)
        if (selectedColors.length > 0) {
          // A API aceita apenas uma cor, então vamos filtrar por múltiplas cores
          // Por enquanto, vamos usar a primeira cor selecionada
          // NOTA: Backend pode ser melhorado no futuro para suportar múltiplas cores
          params.color = selectedColors[0];
        }
        
        // Filtro por estoque
        if (inStockOnly) {
          params.inStock = true;
        }
        
        // Filtro por destaque
        if (featuredOnly) {
          params.featured = true;
        }
        
        // Ordenação
        if (sortBy) {
          params.sortBy = sortBy;
        }
        if (sortOrder) {
          params.sortOrder = sortOrder;
        }
        
        const response = await productsAPI.getAll(params);
        
        // Verificar se a resposta tem paginação (objeto) ou é array direto
        let productsData: Product[];
        let totalCount: number;
        
        if (Array.isArray(response)) {
          // Resposta sem paginação (array direto)
          productsData = response;
          totalCount = response.length;
        } else {
          // Resposta com paginação (objeto)
          productsData = response.products || [];
          totalCount = response.total || 0;
        }
        
        setProducts(productsData);
        setTotalProducts(totalCount);
        setTotalPages(Math.ceil(totalCount / 60));
        
        // Rastrear analytics
        if (searchQuery && searchQuery.trim().length > 0) {
          // Rastrear busca
          AnalyticsEvents.search(searchQuery.trim());
        }
        
        if (selectedCategory && selectedCategory !== 'All') {
          // Rastrear visualização de categoria
          const category = categories.find(c => c.slug === selectedCategory || c.name === selectedCategory);
          if (category) {
            AnalyticsEvents.viewCategory(category.name);
          }
        }
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [currentPage, selectedCategory, searchQuery, priceRange, selectedSizes, selectedColors, inStockOnly, featuredOnly, sortBy, sortOrder, categories]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll para o topo da página
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <style>{`
        @media (min-width: 1024px) {
          .shop-page-grid {
            grid-template-columns: 280px 1fr !important;
          }
          .shop-page-sidebar {
            display: block !important;
          }
        }
        @media (max-width: 1023px) {
          .shop-page-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .product-grid-mobile {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            display: grid !important;
            gap: 0.5rem !important;
          }
        }
        @media (min-width: 640px) {
          .product-grid-mobile {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (min-width: 1024px) {
          .product-grid-mobile {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (min-width: 1280px) {
          .product-grid-mobile {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 py-6 sm:py-12">
      {/* Header Mobile-Friendly */}
      <div className="mb-6 lg:mb-8">
        <h1 className="mb-2 lg:mb-3 text-sky-500" style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900 }}>
          Todos os Produtos
        </h1>
        <p className="mb-4 lg:mb-6 text-gray-600 text-base lg:text-lg">
          Descubra nossa coleção completa de moda infantil
        </p>
        
        {/* Botão de Filtros Mobile - Popup Flutuante */}
        <div className="lg:hidden flex justify-end mb-4">
          <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-sky-500 text-sky-600 hover:bg-sky-50"
              >
                <Filter className="h-4 w-4" />
                Filtros Avançados
                {activeFiltersCount > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-white text-xs font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-sky-500 text-xl font-bold text-left">Filtros Avançados</DialogTitle>
                <DialogDescription>
                  Use os filtros abaixo para encontrar exatamente o que procura
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 -mx-2 sm:-mx-4 px-2 sm:px-4">
                <FilterSidebar
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={handleCategoryChange}
                  priceRange={priceRange}
                  onPriceRangeChange={(range) => {
                    setPriceRange(range);
                    handleFilterChange();
                  }}
                  selectedSizes={selectedSizes}
                  onSizesChange={(sizes) => {
                    setSelectedSizes(sizes);
                    handleFilterChange();
                  }}
                  selectedColors={selectedColors}
                  onColorsChange={(colors) => {
                    setSelectedColors(colors);
                    handleFilterChange();
                  }}
                  inStockOnly={inStockOnly}
                  onInStockChange={(inStock) => {
                    setInStockOnly(inStock);
                    handleFilterChange();
                  }}
                  featuredOnly={featuredOnly}
                  onFeaturedChange={(featured) => {
                    setFeaturedOnly(featured);
                    handleFilterChange();
                  }}
                  availableSizes={availableSizes}
                  availableColors={availableColors}
                  onClearFilters={() => {
                    clearFilters();
                  }}
                  activeFiltersCount={activeFiltersCount}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-6 lg:gap-8 shop-page-grid lg:grid-cols-[280px_1fr]">
        {/* Filters Desktop - Oculto no Mobile */}
        <aside className="hidden lg:block shop-page-sidebar">
          <FilterSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            priceRange={priceRange}
            onPriceRangeChange={(range) => {
              setPriceRange(range);
              handleFilterChange();
            }}
            selectedSizes={selectedSizes}
            onSizesChange={(sizes) => {
              setSelectedSizes(sizes);
              handleFilterChange();
            }}
            selectedColors={selectedColors}
            onColorsChange={(colors) => {
              setSelectedColors(colors);
              handleFilterChange();
            }}
            inStockOnly={inStockOnly}
            onInStockChange={(inStock) => {
              setInStockOnly(inStock);
              handleFilterChange();
            }}
            featuredOnly={featuredOnly}
            onFeaturedChange={(featured) => {
              setFeaturedOnly(featured);
              handleFilterChange();
            }}
            availableSizes={availableSizes}
            availableColors={availableColors}
            onClearFilters={clearFilters}
            activeFiltersCount={activeFiltersCount}
          />
        </aside>

        {/* Products Grid */}
        <div className="min-w-0">
          {/* Controles Mobile-Friendly */}
          <div className="mb-4 lg:mb-6 flex flex-col gap-3 lg:gap-4">
            {/* Info de Produtos */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-gray-600 text-sm lg:text-base">
                {loading ? 'Carregando...' : (
                  <>
                    <span className="hidden sm:inline">Página {currentPage} de {totalPages} - </span>
                    <span className="font-semibold">{totalProducts}</span> produtos
                  </>
                )}
              </p>
              
              {/* Sort Controls Mobile-Friendly */}
              <div className="flex items-center gap-2 flex-wrap">
                <label htmlFor="sortBy" className="text-sm lg:text-base text-gray-600 hidden sm:inline">
                  Ordenar por:
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-lg border border-gray-300 bg-white text-gray-900 px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm lg:text-base focus:border-sky-500 focus:outline-none"
                >
                  <option value="createdAt">Mais Recente</option>
                  <option value="price">Preço</option>
                  <option value="name">Nome</option>
                  <option value="featured">Em Destaque</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="rounded-lg border border-gray-300 bg-white text-gray-900 px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm lg:text-base focus:border-sky-500 focus:outline-none"
                >
                  <option value="desc">Decrescente</option>
                  <option value="asc">Crescente</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl lg:rounded-2xl bg-white p-8 lg:p-12 text-center shadow-md border border-gray-200">
              <p className="text-gray-600 text-base lg:text-lg">Carregando produtos...</p>
            </div>
          ) : products.length > 0 ? (
            <>
            {/* Grid de Produtos Mobile-Friendly - 2x2 no Mobile */}
            <div className="grid gap-2 sm:gap-3 lg:gap-6 product-grid-mobile">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
              
              {/* Paginação Mobile-Friendly */}
              {totalPages > 1 && (
                <div className="mt-6 lg:mt-8 flex justify-center">
                  <Pagination>
                    <PaginationContent className="flex-wrap gap-1 lg:gap-2">
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(currentPage - 1);
                          }}
                          className={`text-sm lg:text-base ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                        />
                      </PaginationItem>
                      
                      {/* Primeira página - Oculto no mobile se houver muitas páginas */}
                      {currentPage > 2 && (
                        <>
                          <PaginationItem className="hidden sm:block">
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(1);
                              }}
                              className="text-sm lg:text-base"
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                          {currentPage > 3 && (
                            <PaginationItem className="hidden sm:block">
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}
                      
                      {/* Páginas ao redor da atual - Menos páginas no mobile */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        // No mobile mostra menos páginas (3), no desktop mostra mais (5)
                        const maxPages = 5;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(pageNum);
                              }}
                              isActive={pageNum === currentPage}
                              className="text-sm lg:text-base min-w-[36px] lg:min-w-[40px]"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {/* Última página - Oculto no mobile se houver muitas páginas */}
                      {currentPage < totalPages - 1 && (
                        <>
                          {currentPage < totalPages - 2 && (
                            <PaginationItem className="hidden sm:block">
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem className="hidden sm:block">
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(totalPages);
                              }}
                              className="text-sm lg:text-base"
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(currentPage + 1);
                          }}
                          className={`text-sm lg:text-base ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl lg:rounded-2xl bg-white p-8 lg:p-12 text-center shadow-md border border-gray-200">
              <p className="mb-3 lg:mb-4 text-gray-600 text-lg lg:text-xl font-semibold">
                Nenhum produto encontrado
              </p>
              <p className="text-gray-500 text-base lg:text-lg">
                Tente ajustar seus filtros ou busca para ver mais resultados
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

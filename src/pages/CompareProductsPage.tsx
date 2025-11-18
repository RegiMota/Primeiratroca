// Página de Comparação de Produtos
// Versão 2.0 - Sistema de Wishlist - Comparação de Produtos

import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { productsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { toast } from 'sonner';
import { X, ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: Array<{ url: string; isPrimary: boolean }>;
  category: {
    id: number;
    name: string;
  };
  sizes?: string[];
  colors?: string[];
  stock: number;
  featured?: boolean;
}

export function CompareProductsPage() {
  const [, setLocation] = useLocation();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productIds, setProductIds] = useState<number[]>([]);

  useEffect(() => {
    // Buscar IDs dos produtos da URL ou localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const idsParam = urlParams.get('ids');
    
    let ids: number[] = [];
    if (idsParam) {
      // IDs vêm da URL
      ids = idsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    } else {
      // Tentar buscar do localStorage
      const savedIds = localStorage.getItem('compareProducts');
      if (savedIds) {
        ids = JSON.parse(savedIds).map((id: string | number) => parseInt(String(id))).filter((id: number) => !isNaN(id));
      }
    }

    if (ids.length === 0) {
      toast.error('Nenhum produto selecionado para comparação');
      setLocation('/wishlist');
      return;
    }

    setProductIds(ids);
    loadProducts(ids);
  }, []);

  const loadProducts = async (ids: number[]) => {
    try {
      setLoading(true);
      
      // Usar silent404=true para não propagar erros 404 (produtos não encontrados são esperados)
      // Com silent404=true, getById retorna null em vez de lançar erro para 404
      const productPromises = ids.map(async (id) => {
        try {
          return await productsAPI.getById(id, true);
        } catch (err: any) {
          // Apenas logar erros que não sejam 404 (outros tipos de erro)
          if (err.response?.status !== 404) {
            console.error(`Erro ao carregar produto ${id}:`, err);
          }
        return null; // Retornar null para produtos que falharam
        }
      });
      const productsData = await Promise.all(productPromises);
      
      // Filtrar produtos nulos (que falharam ao carregar)
      const validProducts = productsData.filter((p): p is Product => p !== null);
      setProducts(validProducts);
      
      // Se nenhum produto foi carregado, redirecionar
      if (validProducts.length === 0) {
        toast.error('Nenhum produto válido encontrado para comparação');
        setLocation('/wishlist');
        return;
      }
      
      // Se alguns produtos falharam, mostrar aviso
      if (validProducts.length < productsData.length) {
        const failedCount = productsData.length - validProducts.length;
        toast.warning(`${failedCount} produto(s) não puderam ser carregados e foram removidos da comparação`);
      }
    } catch (error: any) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos para comparação');
      setLocation('/wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = (productId: number) => {
    const newIds = productIds.filter(id => id !== productId);
    const newProducts = products.filter(p => p.id !== productId);
    
    setProductIds(newIds);
    setProducts(newProducts);
    
    // Atualizar localStorage
    if (newIds.length > 0) {
      localStorage.setItem('compareProducts', JSON.stringify(newIds));
    } else {
      localStorage.removeItem('compareProducts');
    }
    
    // Atualizar URL
    if (newIds.length > 0) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('ids', newIds.join(','));
      window.history.replaceState({}, '', newUrl.toString());
    } else {
      toast.info('Nenhum produto restante para comparar');
      setLocation('/wishlist');
    }
  };

  const handleAddToCart = (product: Product) => {
    try {
      // Verificar se o produto tem tamanhos e cores disponíveis
      const size = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Único';
      const color = product.colors && product.colors.length > 0 ? product.colors[0] : 'Padrão';
      
      addToCart(product as any, 1, size, color);
      toast.success('Produto adicionado ao carrinho!');
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast.error(error.message || 'Erro ao adicionar ao carrinho');
    }
  };

  const getProductImage = (product: Product) => {
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary);
      return primaryImage?.url || product.images[0]?.url || product.image;
    }
    return product.image;
  };

  const getDiscountPercent = (product: Product) => {
    if (product.originalPrice && product.price < product.originalPrice) {
      return Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      );
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <p className="text-gray-600">Carregando produtos para comparação...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <Card className="p-12">
          <h2 className="mb-4 text-2xl font-semibold text-gray-700">
            Nenhum produto para comparar
          </h2>
          <p className="mb-6 text-gray-500">
            Selecione produtos da sua wishlist para comparar
          </p>
          <Button onClick={() => setLocation('/wishlist')} className="rounded-full">
            Voltar para Wishlist
          </Button>
        </Card>
      </div>
    );
  }

  // Obter todas as características únicas para comparação
  const allFeatures = new Set<string>();
  products.forEach(product => {
    if (product.sizes) product.sizes.forEach(size => allFeatures.add(`size:${size}`));
    if (product.colors) product.colors.forEach(color => allFeatures.add(`color:${color}`));
  });

  // Características para exibir na tabela
  const features = [
    'Nome',
    'Categoria',
    'Preço',
    'Desconto',
    'Estoque',
    'Tamanhos',
    'Cores',
    'Ações',
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-sky-500" style={{ fontSize: '2.5rem', fontWeight: 900 }}>
            Comparar Produtos
          </h1>
          <p className="text-gray-600">
            Compare {products.length} produto(s) lado a lado
          </p>
        </div>
        <Button variant="outline" onClick={() => setLocation('/wishlist')} className="rounded-full">
          Voltar para Wishlist
        </Button>
      </div>

      {/* Tabela de Comparação */}
      <div className="overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Característica
                </th>
                {products.map((product) => (
                  <th key={product.id} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <div className="relative">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                        onClick={() => removeProduct(product.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="flex flex-col items-center gap-2">
                        <ImageWithFallback
                          src={getProductImage(product)}
                          alt={product.name}
                          className="h-32 w-32 rounded-lg object-cover"
                        />
                        <Link href={`/product/${product.id}`}>
                          <span className="cursor-pointer text-sm font-semibold hover:text-sky-500">
                            {product.name}
                          </span>
                        </Link>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {/* Nome */}
              <tr>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  Nome
                </td>
                {products.map((product) => (
                  <td key={product.id} className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    <Link href={`/product/${product.id}`}>
                      <span className="cursor-pointer hover:text-sky-500">
                        {product.name}
                      </span>
                    </Link>
                  </td>
                ))}
              </tr>

              {/* Categoria */}
              <tr className="bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  Categoria
                </td>
                {products.map((product) => (
                  <td key={product.id} className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    <Badge variant="outline">{product.category.name}</Badge>
                  </td>
                ))}
              </tr>

              {/* Preço */}
              <tr>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  Preço
                </td>
                {products.map((product) => (
                  <td key={product.id} className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    <div className="flex flex-col gap-1">
                      <span className="text-lg font-bold text-sky-500">
                        R$ {product.price.toFixed(2)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          R$ {product.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Desconto */}
              <tr className="bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  Desconto
                </td>
                {products.map((product) => {
                  const discount = getDiscountPercent(product);
                  return (
                    <td key={product.id} className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {discount > 0 ? (
                        <Badge className="bg-red-500 text-white">
                          -{discount}% OFF
                        </Badge>
                      ) : (
                        <span className="text-gray-400">Sem desconto</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Estoque */}
              <tr>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  Estoque
                </td>
                {products.map((product) => (
                  <td key={product.id} className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {product.stock > 0 ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {product.stock} disponível(is)
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Fora de Estoque</Badge>
                    )}
                  </td>
                ))}
              </tr>

              {/* Tamanhos */}
              <tr className="bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  Tamanhos
                </td>
                {products.map((product) => (
                  <td key={product.id} className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {product.sizes && product.sizes.length > 0 ? (
                        product.sizes.map((size, index) => (
                          <Badge key={`${product.id}-size-${index}-${size}`} variant="outline">
                            {size}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Cores */}
              <tr>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  Cores
                </td>
                {products.map((product) => (
                  <td key={product.id} className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {product.colors && product.colors.length > 0 ? (
                        product.colors.map((color, index) => (
                          <Badge key={`${product.id}-color-${index}-${color}`} variant="outline">
                            {color}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Ações */}
              <tr className="bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  Ações
                </td>
                {products.map((product) => (
                  <td key={product.id} className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        className="w-full rounded-full"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock <= 0}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Adicionar ao Carrinho
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full rounded-full"
                        onClick={() => setLocation(`/product/${product.id}`)}
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


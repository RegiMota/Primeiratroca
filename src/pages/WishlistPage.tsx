// Página de Wishlist/Favoritos
// Versão 2.0 - Sistema de Wishlist

import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { wishlistAPI } from '../lib/api';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { toast } from 'sonner';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Share2,
  ArrowUp,
  Star,
  Edit,
  Copy,
  Check,
  GitCompare,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';

interface WishlistItem {
  id: number;
  userId: number;
  productId: number;
  variantId?: number;
  notes?: string;
  priority: number;
  isPublic: boolean;
  shareCode?: string;
  createdAt: string;
  updatedAt: string;
  product: {
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
    stock: number;
  };
  variant?: {
    id: number;
    size?: string;
    color?: string;
    stock: number;
    reservedStock: number;
  };
}

export function WishlistPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { addToCart } = useCart();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    notes: '',
    priority: 0,
    isPublic: false,
  });
  const [shareLink, setShareLink] = useState<string>('');
  const [copiedShareCode, setCopiedShareCode] = useState<string>('');

  useEffect(() => {
    // Esperar o AuthContext terminar de carregar antes de verificar autenticação
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      toast.error('Você precisa estar logado para ver sua wishlist');
      setLocation('/login');
      return;
    }

    loadWishlist();
    loadStats();
  }, [isAuthenticated, authLoading, setLocation]);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const response = await wishlistAPI.getAll(50, 0);
      setItems(response.items || []);
    } catch (error: any) {
      console.error('Error loading wishlist:', error);
      toast.error(error.message || 'Erro ao carregar wishlist');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await wishlistAPI.getStats();
      setStats(response);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await wishlistAPI.remove(itemId);
      setItems(items.filter((item) => item.id !== itemId));
      toast.success('Item removido da wishlist');
      loadStats();
    } catch (error: any) {
      console.error('Error removing item:', error);
      toast.error(error.message || 'Erro ao remover item');
    }
  };

  const handleRemoveMultiple = async () => {
    if (selectedItems.length === 0) {
      toast.error('Selecione pelo menos um item');
      return;
    }

    try {
      await wishlistAPI.removeMultiple(selectedItems);
      setItems(items.filter((item) => !selectedItems.includes(item.id)));
      setSelectedItems([]);
      toast.success(`${selectedItems.length} item(ns) removido(s) da wishlist`);
      loadStats();
    } catch (error: any) {
      console.error('Error removing items:', error);
      toast.error(error.message || 'Erro ao remover itens');
    }
  };

  const handleMoveToTop = async (itemId: number) => {
    try {
      await wishlistAPI.moveToTop(itemId);
      await loadWishlist();
      toast.success('Item movido para o topo');
    } catch (error: any) {
      console.error('Error moving item:', error);
      toast.error(error.message || 'Erro ao mover item');
    }
  };

  const handleAddToCart = async (item: WishlistItem) => {
    try {
      const product = item.product;
      const size = item.variant?.size || '';
      const color = item.variant?.color || '';
      
      // Verificar estoque
      const availableStock = item.variant
        ? item.variant.stock - item.variant.reservedStock
        : product.stock;

      if (availableStock <= 0) {
        toast.error('Produto fora de estoque');
        return;
      }

      addToCart(product as any, 1, size, color);
      toast.success('Adicionado ao carrinho!');
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast.error(error.message || 'Erro ao adicionar ao carrinho');
    }
  };

  const handleEditItem = (item: WishlistItem) => {
    setEditingItem(item);
    setEditFormData({
      notes: item.notes || '',
      priority: item.priority,
      isPublic: item.isPublic,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      await wishlistAPI.update(editingItem.id, editFormData);
      await loadWishlist();
      setIsEditDialogOpen(false);
      setEditingItem(null);
      toast.success('Item atualizado com sucesso');
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast.error(error.message || 'Erro ao atualizar item');
    }
  };

  const handleShareItem = (item: WishlistItem) => {
    if (!item.shareCode && !item.isPublic) {
      toast.error('Item precisa ser público para compartilhar');
      return;
    }

    if (!item.shareCode) {
      toast.error('Código de compartilhamento não disponível');
      return;
    }

    const shareUrl = `${window.location.origin}/wishlist/share/${item.shareCode}`;
    setShareLink(shareUrl);
    
    // Copiar para clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedShareCode(item.shareCode || '');
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopiedShareCode(''), 2000);
    });
  };

  const toggleSelectItem = (itemId: number) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <div className="mb-2 h-10 w-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-6 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square w-full animate-pulse bg-gray-200 dark:bg-gray-700"></div>
              <CardHeader>
                <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 sm:mb-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-red-500 shadow-lg">
                <Heart className="h-6 w-6 fill-white text-white" />
              </div>
              <h1 className="text-sky-600 dark:text-sky-400" style={{ fontSize: '2rem', fontWeight: 900 }}>
                Minha Lista de Desejos
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              {items.length === 0
                ? 'Nenhum item na sua wishlist'
                : `${items.length} ${items.length === 1 ? 'item' : 'itens'} na sua wishlist`}
            </p>
          </div>
          {items.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedItems.length > 0 && (
                <>
                  {selectedItems.length >= 2 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Salvar IDs no localStorage e navegar para página de comparação
                        localStorage.setItem('compareProducts', JSON.stringify(selectedItems));
                        setLocation(`/compare?ids=${selectedItems.join(',')}`);
                      }}
                      className="rounded-full border-2 border-purple-300 dark:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 dark:hover:border-purple-500 text-purple-700 dark:text-purple-300 font-semibold transition-all"
                    >
                      <GitCompare className="mr-2 h-4 w-4" />
                      Comparar ({selectedItems.length})
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={handleRemoveMultiple}
                    className="rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all font-semibold"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover Selecionados ({selectedItems.length})
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      {stats && items.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-blue-900/20 transition-all hover:shadow-lg hover:scale-105">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-600 dark:text-gray-400 font-medium">Total de Itens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-sky-600 dark:text-sky-400">{stats.total || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-pink-50/50 dark:from-gray-800 dark:to-pink-900/20 transition-all hover:shadow-lg hover:scale-105">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-600 dark:text-gray-400 font-medium">Itens Públicos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-pink-600 dark:text-pink-400">
                {items.filter((item) => item.isPublic).length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-800 dark:to-purple-900/20 transition-all hover:shadow-lg hover:scale-105">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-600 dark:text-gray-400 font-medium">Categorias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                {new Set(items.map((item) => item.product.category.name)).size}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Itens */}
      {items.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-12 sm:p-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-red-200 dark:from-pink-900 dark:to-red-900">
            <Heart className="h-10 w-10 text-pink-500 dark:text-pink-400" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-gray-800 dark:text-gray-200">
            Sua wishlist está vazia
          </h2>
          <p className="mb-8 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Adicione produtos à sua lista de desejos para não perder os itens que você ama!
          </p>
          <Button 
            onClick={() => setLocation('/shop')} 
            className="rounded-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white shadow-lg px-8 py-6 text-lg font-semibold"
          >
            Explorar Produtos
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const product = item.product;
            const variant = item.variant;
            const availableStock = variant
              ? variant.stock - variant.reservedStock
              : product.stock;
            const isSelected = selectedItems.includes(item.id);
            const discount = product.originalPrice
              ? Math.round(
                  ((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100
                )
              : 0;

            const primaryImage =
              product.images && product.images.length > 0
                ? product.images.find((img) => img.isPrimary)?.url ||
                  product.images[0]?.url ||
                  product.image
                : product.image;

            return (
              <Card 
                key={item.id} 
                className={`group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  isSelected 
                    ? 'border-sky-500 dark:border-sky-400 shadow-lg ring-2 ring-sky-200 dark:ring-sky-800' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="relative">
                  <Link href={`/product/${product.id}`}>
                    <div className="relative cursor-pointer overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-orange-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-orange-900/20">
                      <div className="aspect-square w-full overflow-hidden">
                        <ImageWithFallback
                          src={primaryImage}
                          alt={product.name}
                          className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      {discount > 0 && (
                        <Badge className="absolute left-3 top-3 bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg text-xs font-bold px-2.5 py-1">
                          -{discount}% OFF
                        </Badge>
                      )}
                      {item.priority > 0 && (
                        <Badge className="absolute right-3 top-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white border-0 shadow-lg text-xs font-bold px-2.5 py-1 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-white" />
                          Prioridade
                        </Badge>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-sky-500/10 dark:bg-sky-400/10 ring-2 ring-sky-500 dark:ring-sky-400" />
                      )}
                    </div>
                  </Link>
                  <div className="absolute right-2 top-2 z-10 flex gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className={`h-9 w-9 rounded-full border-2 backdrop-blur-sm transition-all ${
                        isSelected
                          ? 'bg-sky-500 border-sky-600 text-white shadow-lg'
                          : 'bg-white/95 border-white/50 hover:bg-white hover:scale-110'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSelectItem(item.id);
                      }}
                    >
                      {isSelected ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <div className="h-4 w-4 rounded border-2 border-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <Link href={`/product/${product.id}`}>
                    <CardTitle className="cursor-pointer text-base font-bold text-gray-900 dark:text-gray-100 hover:text-sky-500 dark:hover:text-sky-400 transition-colors line-clamp-2 min-h-[3rem]">
                      {product.name}
                    </CardTitle>
                  </Link>
                  <CardDescription className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {product.category.name}
                  </CardDescription>
                  {variant && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {variant.size && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5 border-gray-300 dark:border-gray-600 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300">
                          {variant.size}
                        </Badge>
                      )}
                      {variant.color && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5 border-gray-300 dark:border-gray-600 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300">
                          {variant.color}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">
                      R$ {Number(product.price).toFixed(2).replace('.', ',')}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                        R$ {Number(product.originalPrice).toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>

                  {item.notes && (
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2.5">
                      <p className="text-xs text-amber-800 dark:text-amber-300 italic leading-relaxed">
                        "{item.notes}"
                      </p>
                    </div>
                  )}

                  {availableStock <= 0 && (
                    <Badge variant="destructive" className="w-full justify-center py-1.5 text-xs font-semibold">
                      Fora de Estoque
                    </Badge>
                  )}

                  {availableStock > 0 && availableStock <= 5 && (
                    <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-2">
                      <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                        Apenas {availableStock} em estoque!
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      size="sm"
                      className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-md hover:shadow-lg transition-all font-semibold"
                      onClick={() => handleAddToCart(item)}
                      disabled={availableStock <= 0}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Adicionar ao Carrinho
                    </Button>
                    <div className="flex gap-1.5">
                      <Button
                        size="icon"
                        variant="outline"
                        className="flex-1 h-9 rounded-lg border-gray-300 dark:border-gray-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:border-sky-400 dark:hover:border-sky-500 transition-all"
                        onClick={() => handleEditItem(item)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="flex-1 h-9 rounded-lg border-gray-300 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-400 dark:hover:border-green-500 transition-all disabled:opacity-50"
                        onClick={() => handleShareItem(item)}
                        disabled={!item.isPublic}
                        title="Compartilhar"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="flex-1 h-9 rounded-lg border-gray-300 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 dark:hover:border-purple-500 transition-all"
                        onClick={() => handleMoveToTop(item.id)}
                        title="Mover para o topo"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="flex-1 h-9 rounded-lg border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-500 dark:hover:border-red-500 text-red-600 dark:text-red-400 transition-all"
                        onClick={() => handleRemoveItem(item.id)}
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {item.isPublic && item.shareCode && (
                    <div className="mt-3 rounded-lg bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border border-sky-200 dark:border-sky-800 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Share2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                        <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">Item público</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs font-mono text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                          {item.shareCode}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-all"
                          onClick={() => handleShareItem(item)}
                          title="Copiar código"
                        >
                          {copiedShareCode === item.shareCode ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Editar Item da Wishlist</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {editingItem?.product.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="notes" className="dark:text-gray-200">Notas</Label>
              <Textarea
                id="notes"
                value={editFormData.notes}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, notes: e.target.value })
                }
                placeholder="Adicione notas sobre este item..."
                rows={3}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>

            <div>
              <Label htmlFor="priority" className="dark:text-gray-200">Prioridade</Label>
              <Input
                id="priority"
                type="number"
                min="0"
                value={editFormData.priority}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    priority: parseInt(e.target.value) || 0,
                  })
                }
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Maior prioridade = aparece primeiro na lista
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
              <div>
                <Label htmlFor="isPublic" className="dark:text-gray-200">Tornar Público</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Permite compartilhar este item via link
                </p>
              </div>
              <Switch
                id="isPublic"
                checked={editFormData.isPublic}
                onCheckedChange={(checked) =>
                  setEditFormData({ ...editFormData, isPublic: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 hover:dark:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEdit}
              className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// AdminStockPage - Gerenciamento de variações de estoque
// Versão 2.0 - Sistema de estoque avançado

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';
import { adminAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { toast } from 'sonner';

interface ProductVariant {
  id: number;
  productId: number;
  product?: {
    id: number;
    name: string;
  };
  size?: string;
  color?: string;
  stock: number;
  reservedStock: number;
  minStock: number;
  price?: number;
  isActive: boolean;
  createdAt: string;
}

interface Product {
  id: number;
  name: string;
}

interface StockMovement {
  id: number;
  variantId: number;
  variant?: ProductVariant;
  type: string;
  quantity: number;
  orderId?: number;
  reason?: string;
  description?: string;
  userId?: number;
  createdAt: string;
}

export function AdminStockPage() {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [lowStockVariants, setLowStockVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [filterProductId, setFilterProductId] = useState<number | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    size: '',
    color: '',
    stock: '',
    minStock: '5',
    price: '',
    isActive: true,
  });

  const [adjustFormData, setAdjustFormData] = useState({
    quantity: '',
    reason: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, [filterProductId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterProductId) {
        params.productId = filterProductId;
      }

      const [variantsData, productsData, movementsData, lowStockData, statsData] = await Promise.all([
        adminAPI.getStockVariants(params),
        adminAPI.getProducts(),
        adminAPI.getStockMovements({ limit: 50 }),
        adminAPI.getLowStockVariants(),
        adminAPI.getStockStats(),
      ]);

      setVariants(Array.isArray(variantsData) ? variantsData : variantsData.variants || []);
      setProducts(productsData);
      setMovements(Array.isArray(movementsData) ? movementsData : movementsData.movements || []);
      setLowStockVariants(Array.isArray(lowStockData) ? lowStockData : lowStockData.variants || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncProducts = async () => {
    try {
      const loadingToast = toast.loading('Sincronizando produtos com estoque...');
      const result = await adminAPI.syncProductsToStock();
      toast.dismiss(loadingToast);
      
      if (result.success) {
        toast.success(
          `Sincronização concluída! ${result.stats.created} criadas, ${result.stats.updated} atualizadas, ${result.stats.skipped} ignoradas`
        );
        // Recarregar dados após sincronização
        await loadData();
      } else {
        toast.error('Erro ao sincronizar produtos');
      }
    } catch (error: any) {
      console.error('Error syncing products:', error);
      toast.error(error.response?.data?.error || 'Erro ao sincronizar produtos');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      productId: variant.productId.toString(),
      size: variant.size || '',
      color: variant.color || '',
      stock: variant.stock.toString(),
      minStock: variant.minStock.toString(),
      price: variant.price?.toString() || '',
      isActive: variant.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta variação?')) return;

    try {
      await adminAPI.deleteStockVariant(id);
      toast.success('Variação deletada com sucesso');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao deletar variação');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const variantData = {
        productId: parseInt(formData.productId),
        size: formData.size || null,
        color: formData.color || null,
        stock: parseInt(formData.stock) || 0,
        minStock: parseInt(formData.minStock) || 5,
        price: formData.price ? parseFloat(formData.price) : null,
        isActive: formData.isActive,
      };

      if (editingVariant) {
        await adminAPI.updateStockVariant(editingVariant.id, variantData);
        toast.success('Variação atualizada com sucesso');
      } else {
        await adminAPI.createStockVariant(variantData);
        toast.success('Variação criada com sucesso');
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar variação');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVariant) return;

    try {
      await adminAPI.adjustStock(
        selectedVariant.id,
        parseInt(adjustFormData.quantity),
        adjustFormData.reason,
        adjustFormData.description
      );
      toast.success('Estoque ajustado com sucesso');
      setIsMovementDialogOpen(false);
      setAdjustFormData({ quantity: '', reason: '', description: '' });
      setSelectedVariant(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao ajustar estoque');
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      size: '',
      color: '',
      stock: '',
      minStock: '5',
      price: '',
      isActive: true,
    });
    setEditingVariant(null);
  };

  const openAdjustDialog = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setAdjustFormData({ quantity: '', reason: '', description: '' });
    setIsMovementDialogOpen(true);
  };

  const availableStock = (variant: ProductVariant) => variant.stock - variant.reservedStock;
  const isLowStock = (variant: ProductVariant) => availableStock(variant) <= variant.minStock;

  const displayVariants = showLowStock ? lowStockVariants : variants;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Estoque</h1>
          <p className="mt-2 text-gray-600">Gerencie variações e movimentações de estoque</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSyncProducts}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sincronizar Produtos
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Variação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingVariant ? 'Editar Variação' : 'Nova Variação'}</DialogTitle>
                <DialogDescription>
                  {editingVariant ? 'Atualize as informações da variação' : 'Preencha os dados para criar uma nova variação de produto'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="productId">Produto *</Label>
                  <Select
                    value={formData.productId}
                    onValueChange={(value) => setFormData({ ...formData, productId: value })}
                    required
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="size">Tamanho</Label>
                    <Input
                      id="size"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      placeholder="Ex: P, M, G"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Cor</Label>
                    <Input
                      id="color"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      placeholder="Ex: Azul, Vermelho"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="stock">Estoque *</Label>
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      value={formData.stock}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="minStock">Estoque Mínimo *</Label>
                    <Input
                      id="minStock"
                      name="minStock"
                      type="number"
                      value={formData.minStock}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Preço (opcional)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isActive">Variação ativa</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingVariant ? 'Atualizar' : 'Criar'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Variações</p>
                <p className="mt-2 text-2xl font-bold">{stats.totalVariants || variants.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estoque Total</p>
                <p className="mt-2 text-2xl font-bold">{stats.totalStock || 0}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estoque Reservado</p>
                <p className="mt-2 text-2xl font-bold">{stats.totalReserved || 0}</p>
              </div>
              <Package className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estoque Baixo</p>
                <p className="mt-2 text-2xl font-bold text-orange-500">
                  {stats.lowStockCount || lowStockVariants.length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow">
        <div className="flex-1">
          <Label>Filtrar por Produto</Label>
          <Select
            value={filterProductId?.toString() || 'all'}
            onValueChange={(value) => setFilterProductId(value === 'all' ? null : parseInt(value))}
          >
            <SelectTrigger className="mt-2 w-full">
              <SelectValue placeholder="Todos os produtos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os produtos</SelectItem>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id.toString()}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pt-7">
          <input
            type="checkbox"
            id="showLowStock"
            checked={showLowStock}
            onChange={(e) => setShowLowStock(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="showLowStock">Mostrar apenas estoque baixo</Label>
        </div>
      </div>

      {/* Variants Table */}
      <div className="rounded-lg bg-white shadow">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900">Variações de Estoque</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Reservado</TableHead>
                <TableHead>Disponível</TableHead>
                <TableHead>Mínimo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayVariants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    Nenhuma variação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                displayVariants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell className="font-medium">
                      {variant.product?.name || `Produto #${variant.productId}`}
                    </TableCell>
                    <TableCell>{variant.size || '-'}</TableCell>
                    <TableCell>{variant.color || '-'}</TableCell>
                    <TableCell>{variant.stock}</TableCell>
                    <TableCell>{variant.reservedStock}</TableCell>
                    <TableCell>
                      <span className={availableStock(variant) <= 0 ? 'text-red-500 font-bold' : ''}>
                        {availableStock(variant)}
                      </span>
                    </TableCell>
                    <TableCell>{variant.minStock}</TableCell>
                    <TableCell>
                      {isLowStock(variant) ? (
                        <Badge variant="destructive">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Baixo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                      {!variant.isActive && (
                        <Badge variant="outline" className="ml-2">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(variant)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAdjustDialog(variant)}
                          className="text-blue-600"
                        >
                          <TrendingDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(variant.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Adjust Stock Dialog */}
      <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Estoque</DialogTitle>
            <DialogDescription>
              Ajuste a quantidade de estoque para esta variação
            </DialogDescription>
          </DialogHeader>
          {selectedVariant && (
            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">
                  Produto: {selectedVariant.product?.name || `Produto #${selectedVariant.productId}`}
                </p>
                <p className="text-sm text-gray-600">
                  Variação: {selectedVariant.size || '-'} / {selectedVariant.color || '-'}
                </p>
                <p className="mt-2 text-sm font-medium">
                  Estoque atual: {selectedVariant.stock} | Reservado: {selectedVariant.reservedStock} | Disponível: {availableStock(selectedVariant)}
                </p>
              </div>

              <div>
                <Label htmlFor="adjustQuantity">Quantidade *</Label>
                <Input
                  id="adjustQuantity"
                  name="quantity"
                  type="number"
                  value={adjustFormData.quantity}
                  onChange={(e) => setAdjustFormData({ ...adjustFormData, quantity: e.target.value })}
                  required
                  placeholder="Positivo para adicionar, negativo para remover"
                  className="mt-2"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Exemplo: +10 para adicionar, -5 para remover
                </p>
              </div>

              <div>
                <Label htmlFor="adjustReason">Motivo</Label>
                <Input
                  id="adjustReason"
                  name="reason"
                  value={adjustFormData.reason}
                  onChange={(e) => setAdjustFormData({ ...adjustFormData, reason: e.target.value })}
                  placeholder="Ex: Entrada de mercadoria, Perda, Ajuste"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="adjustDescription">Descrição</Label>
                <Input
                  id="adjustDescription"
                  name="description"
                  value={adjustFormData.description}
                  onChange={(e) => setAdjustFormData({ ...adjustFormData, description: e.target.value })}
                  placeholder="Observações adicionais"
                  className="mt-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsMovementDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Ajustar Estoque</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Recent Movements */}
      <div className="rounded-lg bg-white shadow">
        <div className="p-6">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Movimentações Recentes</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Nenhuma movimentação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                movements.slice(0, 20).map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {new Date(movement.createdAt).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {movement.variant?.product?.name || `Produto #${movement.variant?.productId || 'N/A'}`}
                    </TableCell>
                    <TableCell>
                      <Badge>
                        {movement.type === 'reserve' && 'Reserva'}
                        {movement.type === 'release' && 'Liberação'}
                        {movement.type === 'sale' && 'Venda'}
                        {movement.type === 'adjustment' && 'Ajuste'}
                        {movement.type === 'purchase' && 'Compra'}
                        {movement.type === 'return' && 'Devolução'}
                      </Badge>
                    </TableCell>
                    <TableCell className={movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {movement.reason || movement.description || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

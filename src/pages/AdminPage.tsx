import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, LayoutDashboard, Package, ShoppingCart, Tag, Users, FileText, Settings, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';
import { productsAPI, adminAPI, categoriesAPI } from '../lib/api';
import { Product } from '../lib/mockData';
import { Button } from '../components/ui/button';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { AdminDashboardPage } from './AdminDashboardPage';
import { AdminOrdersPage } from './AdminOrdersPage';
import { AdminCategoriesPage } from './AdminCategoriesPage';
import { AdminUsersPage } from './AdminUsersPage';
import { AdminReportsPage } from './AdminReportsPage';
import { AdminSettingsPage } from './AdminSettingsPage';
import { AdminCouponsPage } from './AdminCouponsPage';
import { AnalyticsOverview } from '../components/AnalyticsOverview';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ProductImageManager } from '../components/ProductImageManager';

interface Category {
  id: number;
  name: string;
  slug: string;
}

export function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    categoryId: '',
    image: '',
    stock: '',
    sizes: '["S", "M", "L"]',
    colors: '["Blue", "Red", "Green"]',
    featured: false,
  });

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated || !user?.isAdmin) {
        setLocation('/');
        return;
      }

      try {
        setLoading(true);
        const [productsData, categoriesData] = await Promise.all([
          productsAPI.getAll(),
          categoriesAPI.getAll(),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
        if (categoriesData.length > 0 && !formData.categoryId) {
          setFormData((prev) => ({ ...prev, categoryId: categoriesData[0].id.toString() }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, user, setLocation]);

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const category = categories.find((c) => c.name === (product.category as any)?.name || c.name === product.category);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      categoryId: category?.id.toString() || categories[0]?.id.toString() || '',
      image: product.image,
      stock: product.stock.toString(),
      sizes: JSON.stringify(Array.isArray(product.sizes) ? product.sizes : []),
      colors: JSON.stringify(Array.isArray(product.colors) ? product.colors : []),
      featured: product.featured || false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) {
      return;
    }

    try {
      await adminAPI.deleteProduct(id);
      setProducts(products.filter((p) => p.id !== id));
      toast.success('Produto deletado com sucesso');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao deletar produto');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const productData: ProductData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        originalPrice: formData.originalPrice || null,
        categoryId: parseInt(formData.categoryId),
        image: formData.image,
        stock: parseInt(formData.stock),
        sizes: JSON.parse(formData.sizes),
        colors: JSON.parse(formData.colors),
        featured: formData.featured,
      };

      if (editingProduct) {
        // Update existing product
        const updated = await adminAPI.updateProduct(editingProduct.id, productData);
        setProducts(products.map((p) => (p.id === updated.id ? updated : p)));
        toast.success('Produto atualizado com sucesso');
        // Não fechar o diálogo para permitir gerenciar imagens
        // setIsDialogOpen(false);
      } else {
        // Add new product
        const newProduct = await adminAPI.createProduct(productData);
        setProducts([...products, newProduct]);
        toast.success('Produto criado com sucesso');
        // Definir como editando para permitir gerenciar imagens
        setEditingProduct(newProduct);
        setFormData({
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price.toString(),
          originalPrice: newProduct.originalPrice?.toString() || '',
          categoryId: newProduct.categoryId?.toString() || categories[0]?.id.toString() || '',
          image: newProduct.image,
          stock: newProduct.stock.toString(),
          sizes: JSON.stringify(Array.isArray(newProduct.sizes) ? newProduct.sizes : []),
          colors: JSON.stringify(Array.isArray(newProduct.colors) ? newProduct.colors : []),
          featured: newProduct.featured || false,
        });
      }

      // Não limpar se estiver editando, para permitir gerenciar imagens
      if (!editingProduct) {
        // Produto recém-criado, já está em modo de edição
        // Manter diálogo aberto para gerenciar imagens
      } else {
        // Após atualizar, pode fechar ou manter aberto (opcional)
        // Por enquanto, manter aberto para gerenciar imagens
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar produto');
    } finally {
      setSubmitting(false);
    }
  };

  const openAddDialog = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      categoryId: categories[0]?.id.toString() || '',
      image: '',
      stock: '',
      sizes: '["S", "M", "L"]',
      colors: '["Blue", "Red", "Green"]',
      featured: false,
    });
    setIsDialogOpen(true);
  };

  const getCategoryName = (product: Product) => {
    if (typeof product.category === 'string') {
      return product.category;
    }
    return (product.category as any)?.name || 'Sem categoria';
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <h1 className="mb-2 text-sky-500" style={{ fontSize: '2.5rem', fontWeight: 900 }}>
          Painel Administrativo
        </h1>
        <p className="text-gray-600">Gerenciar loja, produtos e pedidos</p>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Painel
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="mr-2 h-4 w-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Tag className="mr-2 h-4 w-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="coupons">
            <Tag className="mr-2 h-4 w-4" />
            Cupons
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="mr-2 h-4 w-4" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ErrorBoundary>
            <AdminDashboardPage />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="products">
          <div>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="mb-2 text-sky-500" style={{ fontSize: '2rem', fontWeight: 900 }}>
                  Gerenciar Produtos
                </h2>
                <p className="text-gray-600">Adicione, edite ou remova produtos</p>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={openAddDialog}
                    className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
                    style={{ fontWeight: 700 }}
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Adicionar Produto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}
                    </DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome do Produto</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        className="mt-2"
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="price">Preço (R$)</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={handleInputChange}
                          required
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="stock">Estoque</Label>
                        <Input
                          id="stock"
                          name="stock"
                          type="number"
                          value={formData.stock}
                          onChange={handleInputChange}
                          required
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="originalPrice">Preço Original (R$ - opcional)</Label>
                      <Input
                        id="originalPrice"
                        name="originalPrice"
                        type="number"
                        step="0.01"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sizes">Tamanhos (JSON array)</Label>
                      <Input
                        id="sizes"
                        name="sizes"
                        value={formData.sizes}
                        onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                        className="mt-2"
                        placeholder='["S", "M", "L"]'
                      />
                    </div>

                    <div>
                      <Label htmlFor="colors">Cores (JSON array)</Label>
                      <Input
                        id="colors"
                        name="colors"
                        value={formData.colors}
                        onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                        className="mt-2"
                        placeholder='["Blue", "Red", "Green"]'
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="featured">Produto em destaque</Label>
                    </div>

                    <div>
                      <Label htmlFor="image">URL da Imagem Principal (Legado)</Label>
                      <Input
                        id="image"
                        name="image"
                        value={formData.image}
                        onChange={handleInputChange}
                        className="mt-2"
                        placeholder="https://... (opcional se usar múltiplas imagens)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use o campo abaixo para adicionar múltiplas imagens. Este campo é apenas para compatibilidade.
                      </p>
                    </div>

                    {/* Product Image Manager */}
                    {editingProduct && editingProduct.id > 0 && (
                      <div className="mt-4">
                        <ProductImageManager productId={editingProduct.id} disabled={submitting} />
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
                      style={{ fontWeight: 700 }}
                      disabled={submitting}
                    >
                      {submitting ? 'Salvando...' : editingProduct ? 'Atualizar Produto' : 'Adicionar Produto'}
                    </Button>
                    
                    {!editingProduct && (
                      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        <p className="font-medium">💡 Dica:</p>
                        <p>Salve o produto primeiro, depois você poderá adicionar múltiplas imagens através do botão de editar.</p>
                      </div>
                    )}
                  </form>
                </DialogContent>
            </Dialog>
          </div>

          {/* Products Table */}
          <div className="rounded-2xl bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left" style={{ fontWeight: 700 }}>
                  Produto
                </th>
                <th className="px-6 py-4 text-left" style={{ fontWeight: 700 }}>
                  Categoria
                </th>
                <th className="px-6 py-4 text-left" style={{ fontWeight: 700 }}>
                  Preço
                </th>
                <th className="px-6 py-4 text-left" style={{ fontWeight: 700 }}>
                  Estoque
                </th>
                <th className="px-6 py-4 text-right" style={{ fontWeight: 700 }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-600">
                    Carregando produtos...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-600">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-orange-50">
                          <ImageWithFallback
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p style={{ fontWeight: 600 }}>{product.name}</p>
                          <p className="text-gray-600" style={{ fontSize: '0.875rem' }}>
                            {product.description.slice(0, 50)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="border-sky-500 text-sky-500">
                        {getCategoryName(product)}
                      </Badge>
                    </td>
                  <td className="px-6 py-4" style={{ fontWeight: 600 }}>
                    R$ {product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={product.stock < 10 ? 'text-orange-600' : 'text-gray-700'}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                        className="text-sky-500 hover:bg-sky-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          </div>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <ErrorBoundary>
            <AdminOrdersPage />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="categories">
          <ErrorBoundary>
            <AdminCategoriesPage />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="coupons">
          <ErrorBoundary>
            <AdminCouponsPage />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="users">
          <ErrorBoundary>
            <AdminUsersPage />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="analytics">
          <ErrorBoundary>
            <AnalyticsOverview />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="reports">
          <ErrorBoundary>
            <AdminReportsPage />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="settings">
          <ErrorBoundary>
            <AdminSettingsPage />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}

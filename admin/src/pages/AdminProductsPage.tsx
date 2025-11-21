// AdminProductsPage - Gerenciamento de produtos
// Versão 2.0 - Separado do site principal
// Esta página substitui a seção de produtos do AdminPage original

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
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
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ProductImageManager } from '../components/ProductImageManager';
import { toast } from 'sonner';
import { useSearch } from '../contexts/SearchContext';

interface Product {
  id: number;
  name: string;
  description: string;
  detailedDescription?: string;
  price: number;
  originalPrice?: number;
  image: string;
  category?: any; // Mantido para compatibilidade (categoria principal)
  categories?: any[]; // NOVO - Array de categorias (v2.0)
  stock: number;
  sizes: string[];
  colors: string[];
  gender?: string | null; // 'menino', 'menina', 'outros' ou null
  featured: boolean;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { searchQuery } = useSearch();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    detailedDescription: '',
    price: '',
    originalPrice: '',
    categoryIds: [] as string[], // NOVO - Array de IDs de categorias (v2.0)
    image: '',
    stock: '',
    sizes: [] as string[],
    colors: [] as string[],
    gender: '' as string | '',
    featured: false,
  });
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        adminAPI.getAllProducts(),
        adminAPI.getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    // Extrair IDs das categorias (suporta tanto category quanto categories)
    const categoryIds: string[] = [];
    if (product.categories && Array.isArray(product.categories)) {
      categoryIds.push(...product.categories.map((cat: any) => cat.categoryId?.toString() || cat.id?.toString() || ''));
    } else if (product.category) {
      categoryIds.push((product.category as any)?.id?.toString() || '');
    }
    
    setFormData({
      name: product.name,
      description: product.description,
      detailedDescription: product.detailedDescription || '',
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      categoryIds: categoryIds.filter(id => id), // Remover IDs vazios
      image: product.image,
      stock: product.stock.toString(),
      sizes: Array.isArray(product.sizes) ? product.sizes : [],
      colors: Array.isArray(product.colors) ? product.colors : [],
      gender: product.gender || '',
      featured: product.featured,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return;

    try {
      await adminAPI.deleteProduct(id);
      toast.success('Produto deletado com sucesso');
      loadData();
    } catch (error) {
      toast.error('Erro ao deletar produto');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const productData = {
        ...formData,
        detailedDescription: formData.detailedDescription || undefined,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        categoryIds: formData.categoryIds.map(id => parseInt(id)), // NOVO - Array de IDs de categorias (v2.0)
        stock: parseInt(formData.stock),
        sizes: formData.sizes,
        colors: formData.colors,
        gender: formData.gender || undefined, // Opcional: 'menino', 'menina', 'outros' ou undefined
      };

      let productId: number;
      if (editingProduct) {
        await adminAPI.updateProduct(editingProduct.id, productData);
        productId = editingProduct.id;
        toast.success('Produto atualizado com sucesso');
        setIsDialogOpen(false);
        resetForm();
      } else {
        const newProduct = await adminAPI.createProduct(productData);
        productId = newProduct.id;
        toast.success('Produto criado com sucesso! Agora você pode adicionar imagens.');
        // Manter dialog aberto para adicionar imagens
        const selectedCategories = categories.filter(c => formData.categoryIds.includes(c.id.toString()));
        setEditingProduct({ ...productData, id: productId, categories: selectedCategories } as Product);
      }
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar produto');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      detailedDescription: '',
      price: '',
      originalPrice: '',
      categoryIds: [], // NOVO - Array vazio (v2.0)
      image: '',
      stock: '',
      sizes: [],
      colors: [],
      gender: '',
      featured: false,
    });
    setEditingProduct(null);
    setNewSize('');
    setNewColor('');
  };

  const addSize = () => {
    if (newSize.trim() && !formData.sizes.includes(newSize.trim())) {
      setFormData({ ...formData, sizes: [...formData.sizes, newSize.trim()] });
      setNewSize('');
    }
  };

  const removeSize = (size: string) => {
    setFormData({ ...formData, sizes: formData.sizes.filter(s => s !== size) });
  };

  const addColor = () => {
    if (newColor.trim() && !formData.colors.includes(newColor.trim())) {
      setFormData({ ...formData, colors: [...formData.colors, newColor.trim()] });
      setNewColor('');
    }
  };

  const removeColor = (color: string) => {
    setFormData({ ...formData, colors: formData.colors.filter(c => c !== color) });
  };

  const getCategoryNames = (product: Product) => {
    if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
      return product.categories.map((pc: any) => pc.category?.name || pc.name || 'Sem nome').join(', ');
    }
    if (product.category) {
      return (product.category as any)?.name || 'Sem categoria';
    }
    return 'Sem categoria';
  };

  // Filtrar produtos baseado na busca
  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      getCategoryName(product).toLowerCase().includes(query) ||
      product.price.toString().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-600">Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">Gerenciar produtos da loja</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct 
                  ? 'Atualize as informações do produto abaixo'
                  : 'Preencha os dados para criar um novo produto'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
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
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="detailedDescription">Descrição Detalhada (Opcional)</Label>
                <Textarea
                  id="detailedDescription"
                  name="detailedDescription"
                  value={formData.detailedDescription}
                  onChange={handleInputChange}
                  placeholder="Descrição mais detalhada do produto. Esta descrição aparecerá na página do produto abaixo das fotos."
                  rows={6}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Esta descrição aparecerá na página do produto, abaixo das fotos e acima das avaliações.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Preço</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="originalPrice">Preço Original (opcional)</Label>
                  <Input
                    id="originalPrice"
                    name="originalPrice"
                    type="number"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              {/* Categorias - Seleção Múltipla */}
              <div>
                <Label>Categorias</Label>
                <div className="mt-2 space-y-2">
                  {categories.map((cat) => {
                    const isSelected = formData.categoryIds.includes(cat.id.toString());
                    return (
                      <div key={cat.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`category-${cat.id}`}
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                categoryIds: [...formData.categoryIds, cat.id.toString()],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                categoryIds: formData.categoryIds.filter(id => id !== cat.id.toString()),
                              });
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor={`category-${cat.id}`} className="text-sm font-normal cursor-pointer">
                          {cat.name}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                {formData.categoryIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.categoryIds.map((catId) => {
                      const category = categories.find(c => c.id.toString() === catId);
                      if (!category) return null;
                      return (
                        <Badge key={catId} variant="secondary" className="flex items-center gap-1">
                          {category.name}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                categoryIds: formData.categoryIds.filter(id => id !== catId),
                              });
                            }}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Selecione uma ou mais categorias para este produto
                </p>
              </div>
              <div>
                <Label htmlFor="image">URL da Imagem</Label>
                <Input
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  required
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
                />
              </div>
              
              {/* Tamanhos */}
              <div>
                <Label>Tamanhos</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Ex: P, M, G, GG"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSize();
                      }
                    }}
                  />
                  <Button type="button" onClick={addSize} variant="outline">
                    Adicionar
                  </Button>
                </div>
                {formData.sizes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.sizes.map((size) => (
                      <Badge key={size} variant="secondary" className="flex items-center gap-1">
                        {size}
                        <button
                          type="button"
                          onClick={() => removeSize(size)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Cores */}
              <div>
                <Label>Cores</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Ex: Azul, Vermelho, Verde"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addColor();
                      }
                    }}
                  />
                  <Button type="button" onClick={addColor} variant="outline">
                    Adicionar
                  </Button>
                </div>
                {formData.colors.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.colors.map((color) => (
                      <Badge key={color} variant="secondary" className="flex items-center gap-1">
                        {color}
                        <button
                          type="button"
                          onClick={() => removeColor(color)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Gênero */}
              <div>
                <Label htmlFor="gender">Gênero (Opcional)</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o gênero (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    <SelectItem value="menino">Menino</SelectItem>
                    <SelectItem value="menina">Menina</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Especifique se o produto é para menino, menina ou outros
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                />
                <Label htmlFor="featured">Produto em destaque</Label>
              </div>

              {/* Gerenciador de Imagens - Apenas para produtos editados */}
              {editingProduct && editingProduct.id > 0 && (
                <div className="border-t pt-4 mt-4">
                  <Label className="text-base font-semibold">Galeria de Imagens</Label>
                  <p className="text-sm text-gray-500 mb-4">
                    Adicione múltiplas imagens para este produto
                  </p>
                  <ProductImageManager productId={editingProduct.id} />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : editingProduct ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {searchQuery && (
        <div className="rounded-lg border bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            {filteredProducts.length} de {products.length} produto(s) encontrado(s) para "{searchQuery}"
          </p>
        </div>
      )}

      <div className="rounded-lg border bg-white">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Produto</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Categoria</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Preço</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Estoque</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-600">
                  {searchQuery ? `Nenhum produto encontrado para "${searchQuery}"` : 'Nenhum produto encontrado'}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.description.substring(0, 50)}...</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {getCategoryNames(product)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  R$ {product.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {product.stock}
                </td>
                <td className="px-6 py-4">
                  {product.featured && <Badge variant="default">Destaque</Badge>}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
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
  );
}


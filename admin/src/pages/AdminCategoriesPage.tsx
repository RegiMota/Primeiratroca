import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Plus, Edit, Trash2, Menu as MenuIcon, ChevronDown, GripVertical } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI, categoriesAPI, menusAPI } from '../lib/api';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { useSearch } from '../contexts/SearchContext';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface MenuItem {
  id: number;
  menuId: number;
  label: string;
  href: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Menu {
  id: number;
  label: string;
  href: string | null;
  order: number;
  isActive: boolean;
  items: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

export function AdminCategoriesPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { searchQuery } = useSearch();
  const [selectedCategoryForMenu, setSelectedCategoryForMenu] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState('categories');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  useEffect(() => {
    const loadCategories = async () => {

      try {
        setLoading(true);
        const categoriesData = await adminAPI.getAllCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Erro ao carregar categorias');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: editingCategory ? formData.slug : generateSlug(name),
    });
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta categoria? Produtos associados podem ser afetados.')) {
      return;
    }

    try {
      await adminAPI.deleteCategory(id);
      setCategories(categories.filter((c) => c.id !== id));
      toast.success('Categoria deletada com sucesso');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.data?.error || 'Erro ao deletar categoria');
    }
  };

  // Filtrar categorias baseado na busca
  const filteredCategories = categories.filter((category) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      category.name.toLowerCase().includes(query) ||
      category.slug.toLowerCase().includes(query) ||
      (category.description && category.description.toLowerCase().includes(query))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const categoryData = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description || undefined,
      };

      if (editingCategory) {
        // Update existing category
        const updated = await adminAPI.updateCategory(editingCategory.id, categoryData);
        setCategories(categories.map((c) => (c.id === updated.id ? updated : c)));
        toast.success('Categoria atualizada com sucesso');
      } else {
        // Add new category
        const newCategory = await adminAPI.createCategory(categoryData);
        setCategories([...categories, newCategory]);
        toast.success('Categoria criada com sucesso');
      }

      setIsDialogOpen(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
      });
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar categoria');
    } finally {
      setSubmitting(false);
    }
  };

  const openAddDialog = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
    });
    setIsDialogOpen(true);
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      setLocation('/');
    }
  }, [isAuthenticated, user, setLocation]);

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="mb-2 text-sky-500" style={{ fontSize: '2rem', fontWeight: 900 }}>
          Gerenciar Categorias e Menus
        </h2>
        <p className="text-gray-600">Adicione, edite ou remova categorias de produtos e configure a navbar</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="menus">
            <MenuIcon className="mr-2 h-4 w-4" />
            Menus da Navbar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="mb-2 text-xl font-bold text-gray-800">Categorias de Produtos</h3>
            </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openAddDialog}
              className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
              style={{ fontWeight: 700 }}
            >
              <Plus className="mr-2 h-5 w-5" />
              Adicionar Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Editar Categoria' : 'Adicionar Nova Categoria'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? 'Atualize as informações da categoria abaixo'
                  : 'Preencha os dados para criar uma nova categoria'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Categoria</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="mt-2"
                  placeholder="Ex: Vestidos"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug (URL amigável)</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  className="mt-2"
                  placeholder="Ex: vestidos"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Será gerado automaticamente se deixado em branco
                </p>
              </div>

              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-2"
                  rows={3}
                  placeholder="Descrição da categoria..."
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
                style={{ fontWeight: 700 }}
                disabled={submitting}
              >
                {submitting
                  ? 'Salvando...'
                  : editingCategory
                  ? 'Atualizar Categoria'
                  : 'Adicionar Categoria'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {searchQuery && (
        <div className="rounded-lg border bg-blue-50 p-4 mb-4">
          <p className="text-sm text-blue-800">
            {filteredCategories.length} de {categories.length} categoria(s) encontrada(s) para "{searchQuery}"
          </p>
        </div>
      )}

      {/* Categories Table */}
      <div className="rounded-2xl bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left" style={{ fontWeight: 700 }}>
                  Nome
                </th>
                <th className="px-6 py-4 text-left" style={{ fontWeight: 700 }}>
                  Slug
                </th>
                <th className="px-6 py-4 text-left" style={{ fontWeight: 700 }}>
                  Descrição
                </th>
                <th className="px-6 py-4 text-right" style={{ fontWeight: 700 }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-600">
                    Carregando categorias...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-600">
                    {searchQuery ? `Nenhuma categoria encontrada para "${searchQuery}"` : 'Nenhuma categoria encontrada'}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p style={{ fontWeight: 600 }}>{category.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="border-sky-500 text-sky-500">
                        {category.slug}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600" style={{ fontSize: '0.875rem' }}>
                        {category.description || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedCategoryForMenu(category);
                            setActiveTab('menus');
                            toast.info('Selecione um menu e clique em "Adicionar Submenu" para criar um item com esta categoria');
                          }}
                          className="text-green-500 hover:bg-green-50"
                          title="Criar menu com esta categoria"
                        >
                          <MenuIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(category)}
                          className="text-sky-500 hover:bg-sky-50"
                          title="Editar categoria"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
                          className="text-red-500 hover:bg-red-50"
                          title="Deletar categoria"
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
        </TabsContent>

        <TabsContent value="menus">
          <AdminMenusSection 
            categories={categories}
            selectedCategoryForMenu={selectedCategoryForMenu}
            onCategorySelectedForMenu={setSelectedCategoryForMenu}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente para gerenciar menus
function AdminMenusSection({ 
  categories,
  selectedCategoryForMenu,
  onCategorySelectedForMenu
}: { 
  categories: Category[];
  selectedCategoryForMenu: Category | null;
  onCategorySelectedForMenu: (category: Category | null) => void;
}) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [menuFormData, setMenuFormData] = useState({
    label: '',
    href: '',
    order: 0,
    isActive: true,
  });

  const [itemFormData, setItemFormData] = useState({
    label: '',
    href: '',
    order: 0,
    isActive: true,
    // Novos campos para filtros
    selectedCategory: '',
    gender: 'all',
    featured: false,
    newProducts: false,
  });

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const menusData = await menusAPI.getAll();
      setMenus(menusData);
    } catch (error) {
      console.error('Error loading menus:', error);
      toast.error('Erro ao carregar menus');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setMenuFormData({
      label: menu.label,
      href: menu.href || '',
      order: menu.order,
      isActive: menu.isActive,
    });
    setIsMenuDialogOpen(true);
  };

  const handleMenuDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este menu? Todos os submenus serão removidos.')) {
      return;
    }

    try {
      await menusAPI.delete(id);
      setMenus(menus.filter((m) => m.id !== id));
      toast.success('Menu deletado com sucesso');
    } catch (error: any) {
      console.error('Error deleting menu:', error);
      toast.error(error.response?.data?.error || 'Erro ao deletar menu');
    }
  };

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const menuData = {
        label: menuFormData.label,
        href: menuFormData.href || null,
        order: menuFormData.order,
        isActive: menuFormData.isActive,
      };

      if (editingMenu) {
        const updated = await menusAPI.update(editingMenu.id, menuData);
        setMenus(menus.map((m) => (m.id === updated.id ? updated : m)));
        toast.success('Menu atualizado com sucesso');
      } else {
        const newMenu = await menusAPI.create(menuData);
        setMenus([...menus, newMenu]);
        toast.success('Menu criado com sucesso');
      }

      setIsMenuDialogOpen(false);
      setEditingMenu(null);
      setMenuFormData({
        label: '',
        href: '',
        order: 0,
        isActive: true,
      });
    } catch (error: any) {
      console.error('Error saving menu:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar menu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleItemEdit = (item: MenuItem) => {
    setEditingMenuItem(item);
    
    // Extrair informações do href
    try {
      const url = new URL(item.href, 'http://localhost');
      const categorySlug = url.searchParams.get('category') || '';
      const gender = url.searchParams.get('gender') || 'all';
      const featured = url.searchParams.get('featured') === 'true';
      const newProducts = url.searchParams.get('new') === 'true';
      
      setItemFormData({
        label: item.label,
        href: item.href,
        order: item.order,
        isActive: item.isActive,
        selectedCategory: categorySlug,
        gender: gender || 'all',
        featured: featured,
        newProducts: newProducts,
      });
    } catch (error) {
      // Se não conseguir parsear a URL, usar valores padrão
      setItemFormData({
        label: item.label,
        href: item.href,
        order: item.order,
        isActive: item.isActive,
        selectedCategory: '',
        gender: 'all',
        featured: false,
        newProducts: false,
      });
    }
    setIsItemDialogOpen(true);
  };

  const handleItemDelete = async (itemId: number) => {
    if (!confirm('Tem certeza que deseja deletar este item do menu?')) {
      return;
    }

    try {
      await menusAPI.deleteItem(itemId);
      await loadMenus(); // Recarregar para atualizar a lista
      toast.success('Item do menu deletado com sucesso');
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      toast.error(error.response?.data?.error || 'Erro ao deletar item do menu');
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuId && !editingMenuItem) {
      toast.error('Selecione um menu primeiro');
      return;
    }

    setSubmitting(true);

    try {
      const itemData = {
        label: itemFormData.label,
        href: itemFormData.href,
        order: itemFormData.order,
        isActive: itemFormData.isActive,
      };

      if (editingMenuItem) {
        const updated = await menusAPI.updateItem(editingMenuItem.id, itemData);
        await loadMenus();
        toast.success('Item do menu atualizado com sucesso');
      } else {
        await menusAPI.createItem(selectedMenuId!, itemData);
        await loadMenus();
        toast.success('Item do menu criado com sucesso');
      }

      setIsItemDialogOpen(false);
      setEditingMenuItem(null);
      setSelectedMenuId(null);
      setItemFormData({
        label: '',
        href: '',
        order: 0,
        isActive: true,
        selectedCategory: '',
        gender: 'all',
        featured: false,
        newProducts: false,
      });
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar item do menu');
    } finally {
      setSubmitting(false);
    }
  };

  const openAddMenuDialog = () => {
    setEditingMenu(null);
    setMenuFormData({
      label: '',
      href: '',
      order: menus.length,
      isActive: true,
    });
    setIsMenuDialogOpen(true);
  };

  const openAddItemDialog = (menuId: number, category?: Category) => {
    setSelectedMenuId(menuId);
    setEditingMenuItem(null);
    const menu = menus.find((m) => m.id === menuId);
    
    // Usar a categoria selecionada ou a categoria passada como parâmetro
    const categoryToUse = selectedCategoryForMenu || category;
    
    // Se uma categoria foi passada, pré-preencher os dados
    const initialHref = categoryToUse 
      ? `/shop?category=${categoryToUse.slug}`
      : '';
    
    setItemFormData({
      label: categoryToUse?.name || '',
      href: initialHref,
      order: menu?.items.length || 0,
      isActive: true,
      selectedCategory: categoryToUse?.slug || '',
      gender: 'all',
      featured: false,
      newProducts: false,
    });
    setIsItemDialogOpen(true);
    
    // Limpar a categoria selecionada após usar
    if (selectedCategoryForMenu) {
      onCategorySelectedForMenu(null);
    }
  };

  // Função para gerar link automaticamente baseado nos filtros
  const generateLink = (categorySlug: string, gender: string, featured: boolean, newProducts: boolean) => {
    const params = new URLSearchParams();
    
    if (categorySlug) {
      params.append('category', categorySlug);
    }
    
    if (gender && gender !== 'all') {
      params.append('gender', gender);
    }
    
    if (featured) {
      params.append('featured', 'true');
    }
    
    if (newProducts) {
      params.append('new', 'true');
    }
    
    return `/shop?${params.toString()}`;
  };

  // Atualizar link quando filtros mudarem (mas não quando o href já foi editado manualmente)
  useEffect(() => {
    // Só gerar automaticamente se não estiver editando um item existente ou se o href ainda não foi definido
    if (!editingMenuItem && itemFormData.selectedCategory) {
      const newLink = generateLink(
        itemFormData.selectedCategory,
        itemFormData.gender,
        itemFormData.featured,
        itemFormData.newProducts
      );
      // Só atualizar se o link gerado for diferente do atual (para evitar loops)
      if (newLink !== itemFormData.href) {
        setItemFormData(prev => ({ ...prev, href: newLink }));
      }
    }
  }, [itemFormData.selectedCategory, itemFormData.gender, itemFormData.featured, itemFormData.newProducts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="mb-2 text-xl font-bold text-gray-800">Menus da Navbar</h3>
          <p className="text-sm text-gray-600">Configure os menus e submenus da barra de navegação</p>
        </div>

        <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openAddMenuDialog}
              className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
              style={{ fontWeight: 700 }}
            >
              <Plus className="mr-2 h-5 w-5" />
              Adicionar Menu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMenu ? 'Editar Menu' : 'Adicionar Novo Menu'}
              </DialogTitle>
              <DialogDescription>
                {editingMenu
                  ? 'Atualize as informações do menu abaixo'
                  : 'Crie um novo menu para a navbar. Deixe o link em branco se o menu tiver submenus.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleMenuSubmit} className="space-y-4">
              <div>
                <Label htmlFor="menu-label">Label do Menu</Label>
                <Input
                  id="menu-label"
                  value={menuFormData.label}
                  onChange={(e) => setMenuFormData({ ...menuFormData, label: e.target.value })}
                  required
                  className="mt-2"
                  placeholder="Ex: BEBÊS, MENINAS"
                />
              </div>

              <div>
                <Label htmlFor="menu-href">Link (opcional)</Label>
                <Input
                  id="menu-href"
                  value={menuFormData.href}
                  onChange={(e) => setMenuFormData({ ...menuFormData, href: e.target.value })}
                  className="mt-2"
                  placeholder="Ex: /shop?category=baby"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Deixe em branco se o menu tiver submenus
                </p>
              </div>

              <div>
                <Label htmlFor="menu-order">Ordem</Label>
                <Input
                  id="menu-order"
                  type="number"
                  value={menuFormData.order}
                  onChange={(e) => setMenuFormData({ ...menuFormData, order: parseInt(e.target.value) || 0 })}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="menu-active">Ativo</Label>
                <Switch
                  id="menu-active"
                  checked={menuFormData.isActive}
                  onCheckedChange={(checked) => setMenuFormData({ ...menuFormData, isActive: checked })}
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
                style={{ fontWeight: 700 }}
                disabled={submitting}
              >
                {submitting
                  ? 'Salvando...'
                  : editingMenu
                  ? 'Atualizar Menu'
                  : 'Adicionar Menu'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Menus Table */}
      <div className="rounded-2xl bg-white shadow-md">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-600">
              Carregando menus...
            </div>
          ) : menus.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-600">
              Nenhum menu encontrado. Crie um menu para começar.
            </div>
          ) : (
            <div className="divide-y">
              {menus.map((menu) => (
                <div key={menu.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg">{menu.label}</h4>
                          {menu.href && (
                            <Badge variant="outline" className="text-xs">
                              Link: {menu.href}
                            </Badge>
                          )}
                          <Badge variant={menu.isActive ? 'default' : 'secondary'}>
                            {menu.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Ordem: {menu.order} • {menu.items.length} submenu(s)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAddItemDialog(menu.id)}
                        className="text-sky-500 hover:bg-sky-50"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Submenu
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMenuEdit(menu)}
                        className="text-sky-500 hover:bg-sky-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMenuDelete(menu.id)}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Submenus */}
                  {menu.items.length > 0 && (
                    <div className="ml-8 mt-4 space-y-2">
                      {menu.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium">{item.label}</p>
                              <p className="text-xs text-gray-500">{item.href}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleItemEdit(item)}
                              className="text-sky-500 hover:bg-sky-50"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleItemDelete(item.id)}
                              className="text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog para adicionar/editar item do menu */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMenuItem ? 'Editar Item do Menu' : 'Adicionar Item ao Submenu'}
            </DialogTitle>
            <DialogDescription>
              {editingMenuItem
                ? 'Atualize as informações do item do menu abaixo'
                : 'Adicione um novo item ao submenu selecionado'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleItemSubmit} className="space-y-4">
            <div>
              <Label htmlFor="item-label">Label do Item</Label>
              <Input
                id="item-label"
                value={itemFormData.label}
                onChange={(e) => setItemFormData({ ...itemFormData, label: e.target.value })}
                required
                className="mt-2"
                placeholder="Ex: Conjuntos, Vestidos"
              />
            </div>

            <div>
              <Label htmlFor="item-category">Categoria</Label>
              <Select
                value={itemFormData.selectedCategory}
                onValueChange={(value) => {
                  const category = categories.find(c => c.slug === value);
                  setItemFormData(prev => ({
                    ...prev,
                    selectedCategory: value,
                    label: category?.name || prev.label,
                  }));
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                Selecione uma categoria para gerar o link automaticamente
              </p>
            </div>

            <div>
              <Label htmlFor="item-gender">Gênero (opcional)</Label>
              <Select
                value={itemFormData.gender}
                onValueChange={(value) => setItemFormData(prev => ({ ...prev, gender: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione um gênero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="girls">Meninas</SelectItem>
                  <SelectItem value="boys">Meninos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="item-featured">Produtos em Destaque</Label>
              <Switch
                id="item-featured"
                checked={itemFormData.featured}
                onCheckedChange={(checked) => setItemFormData(prev => ({ ...prev, featured: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="item-new">Novidades</Label>
              <Switch
                id="item-new"
                checked={itemFormData.newProducts}
                onCheckedChange={(checked) => setItemFormData(prev => ({ ...prev, newProducts: checked }))}
              />
            </div>

            <div>
              <Label htmlFor="item-href">Link (gerado automaticamente)</Label>
              <Input
                id="item-href"
                value={itemFormData.href}
                onChange={(e) => setItemFormData({ ...itemFormData, href: e.target.value })}
                required
                className="mt-2"
                placeholder="Ex: /shop?category=conjuntos"
              />
              <p className="mt-1 text-xs text-gray-500">
                O link é gerado automaticamente baseado nos filtros acima. Você pode editá-lo manualmente se necessário.
              </p>
            </div>

            <div>
              <Label htmlFor="item-order">Ordem</Label>
              <Input
                id="item-order"
                type="number"
                value={itemFormData.order}
                onChange={(e) => setItemFormData({ ...itemFormData, order: parseInt(e.target.value) || 0 })}
                className="mt-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="item-active">Ativo</Label>
              <Switch
                id="item-active"
                checked={itemFormData.isActive}
                onCheckedChange={(checked) => setItemFormData({ ...itemFormData, isActive: checked })}
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
              style={{ fontWeight: 700 }}
              disabled={submitting}
            >
              {submitting
                ? 'Salvando...'
                : editingMenuItem
                ? 'Atualizar Item'
                : 'Adicionar Item'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


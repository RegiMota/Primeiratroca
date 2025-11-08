import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';
import { adminAPI, categoriesAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
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

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  useEffect(() => {
    const loadCategories = async () => {
      if (!isAuthenticated || !user?.isAdmin) {
        setLocation('/');
        return;
      }

      try {
        setLoading(true);
        const categoriesData = await categoriesAPI.getAll();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Erro ao carregar categorias');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [isAuthenticated, user, setLocation]);

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

  if (!isAuthenticated || !user?.isAdmin) {
    setLocation('/');
    return null;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="mb-2 text-sky-500" style={{ fontSize: '2rem', fontWeight: 900 }}>
            Gerenciar Categorias
          </h2>
          <p className="text-gray-600">Adicione, edite ou remova categorias de produtos</p>
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
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-600">
                    Nenhuma categoria encontrada
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
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
                          onClick={() => handleEdit(category)}
                          className="text-sky-500 hover:bg-sky-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
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
  );
}


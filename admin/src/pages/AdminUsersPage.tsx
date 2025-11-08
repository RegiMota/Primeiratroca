import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Shield, Mail, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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
import { toast } from 'sonner';
import { useSearch } from '../contexts/SearchContext';

interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  ordersCount?: number;
}

export function AdminUsersPage() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { searchQuery } = useSearch();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    isAdmin: false,
  });

  useEffect(() => {
    const loadUsers = async () => {

      try {
        setLoading(true);
        const usersData = await adminAPI.getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Erro ao carregar usuários');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Filtrar usuários baseado na busca
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (id === currentUser?.id) {
      toast.error('Você não pode deletar seu próprio usuário');
      return;
    }

    if (!confirm('Tem certeza que deseja deletar este usuário? Todos os pedidos associados serão mantidos, mas o usuário não poderá mais acessar o sistema.')) {
      return;
    }

    try {
      await adminAPI.deleteUser(id);
      setUsers(users.filter((u) => u.id !== id));
      toast.success('Usuário deletado com sucesso');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.error || 'Erro ao deletar usuário');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingUser) {
        // Prevent removing admin status from self
        const userData = { ...formData };
        if (editingUser.id === currentUser?.id) {
          userData.isAdmin = true; // Keep admin status
        }

        // Update existing user
        const updated = await adminAPI.updateUser(editingUser.id, userData);
        setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
        toast.success('Usuário atualizado com sucesso');
      }

      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        isAdmin: false,
      });
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const openAddDialog = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      isAdmin: false,
    });
    setIsDialogOpen(true);
  };

  if (!isAuthenticated || !currentUser?.isAdmin) {
    setLocation('/');
    return null;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="mb-2 text-sky-500" style={{ fontSize: '2rem', fontWeight: 900 }}>
            Gerenciar Usuários
          </h2>
          <p className="text-gray-600">Visualize e gerencie todos os usuários do sistema</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left" style={{ fontWeight: 700 }}>
                  Usuário
                </th>
                <th className="px-6 py-4 text-left" style={{ fontWeight: 700 }}>
                  Email
                </th>
                <th className="px-6 py-4 text-left" style={{ fontWeight: 700 }}>
                  Tipo
                </th>
                <th className="px-6 py-4 text-left" style={{ fontWeight: 700 }}>
                  Pedidos
                </th>
                <th className="px-6 py-4 text-left" style={{ fontWeight: 700 }}>
                  Cadastro
                </th>
                <th className="px-6 py-4 text-right" style={{ fontWeight: 700 }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-600">
                    Carregando usuários...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-600">
                    {searchQuery ? `Nenhum usuário encontrado para "${searchQuery}"` : 'Nenhum usuário encontrado'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-white">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p style={{ fontWeight: 600 }}>{user.name}</p>
                          {user.id === currentUser?.id && (
                            <p className="text-xs text-gray-500">(Você)</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={
                          user.isAdmin
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-300 bg-gray-50 text-gray-700'
                        }
                      >
                        <Shield className="mr-1 h-3 w-3" />
                        {user.isAdmin ? 'Admin' : 'Cliente'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-700">{user.ordersCount || 0} pedidos</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                          className="text-sky-500 hover:bg-sky-50"
                          disabled={user.id === currentUser?.id && !user.isAdmin}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user.id)}
                          className="text-red-500 hover:bg-red-50"
                          disabled={user.id === currentUser?.id}
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

      {/* Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
            </DialogTitle>
            <DialogDescription>
              {editingUser 
                ? 'Atualize as informações do usuário abaixo'
                : 'Preencha os dados para criar um novo usuário'}
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-2"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-2"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg border p-4">
                <input
                  type="checkbox"
                  id="isAdmin"
                  name="isAdmin"
                  checked={formData.isAdmin}
                  onChange={handleInputChange}
                  className="h-4 w-4"
                  disabled={editingUser.id === currentUser?.id}
                />
                <Label htmlFor="isAdmin" className="cursor-pointer">
                  Usuário Administrador
                </Label>
              </div>

              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-semibold">Nota:</p>
                <p className="mt-1">
                  {editingUser.id === currentUser?.id
                    ? 'Você está editando seu próprio perfil. Não é possível alterar o status de administrador.'
                    : 'Alterar o status de administrador concederá ou revogará acesso ao painel administrativo.'}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
                style={{ fontWeight: 700 }}
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : 'Atualizar Usuário'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


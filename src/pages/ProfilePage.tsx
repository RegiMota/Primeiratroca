// ProfilePage - Página de Perfil do Usuário
// Versão 2.0 - Perfil de Usuário Padrão

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';
import { authAPI, ordersAPI, wishlistAPI, addressesAPI, ticketsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
  User,
  Mail,
  Package,
  Heart,
  MapPin,
  MessageSquare,
  Edit2,
  Save,
  X,
  Calendar,
  Shield,
  ShoppingBag,
  Cake,
  CreditCard,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

export function ProfilePage() {
  const { user, isAuthenticated, updateUser, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ordersCount: 0,
    wishlistCount: 0,
    addressesCount: 0,
    ticketsCount: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthDate: '',
    cpf: '',
  });

  useEffect(() => {
    // Esperar o AuthContext terminar de carregar antes de verificar autenticação
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      setLocation('/login');
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        
        // Carregar dados do usuário
        const userData = await authAPI.getCurrentUser();
        
        // Formatar CPF se existir
        let formattedCpf = '';
        if (userData.user.cpf) {
          const cpfDigits = userData.user.cpf.replace(/\D/g, '');
          if (cpfDigits.length === 11) {
            formattedCpf = cpfDigits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
          } else {
            formattedCpf = userData.user.cpf;
          }
        }
        
        setFormData({
          name: userData.user.name,
          email: userData.user.email,
          birthDate: userData.user.birthDate 
            ? new Date(userData.user.birthDate).toISOString().split('T')[0]
            : '',
          cpf: formattedCpf,
        });

        // Carregar estatísticas
        try {
          const [ordersRes, wishlistRes, addressesRes, ticketsRes] = await Promise.all([
            ordersAPI.getAll().catch(() => []),
            wishlistAPI.getAll().catch(() => ({ items: [] })),
            addressesAPI.getAll().catch(() => ({ addresses: [] })),
            ticketsAPI.getAll().catch(() => ({ tickets: [] })),
          ]);
          
          // Formato: ordersAPI retorna array direto, outros retornam objeto com propriedade
          setStats({
            ordersCount: Array.isArray(ordersRes) ? ordersRes.length : 0,
            wishlistCount: Array.isArray(wishlistRes) ? wishlistRes.length : (wishlistRes.items?.length || 0),
            addressesCount: Array.isArray(addressesRes) ? addressesRes.length : (addressesRes.addresses?.length || 0),
            ticketsCount: Array.isArray(ticketsRes) ? ticketsRes.length : (ticketsRes.tickets?.length || 0),
          });
        } catch (error) {
          console.error('Error loading stats:', error);
        }
      } catch (error: any) {
        console.error('Error loading profile:', error);
        toast.error('Erro ao carregar perfil', {
          description: error.response?.data?.error || 'Tente novamente mais tarde.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isAuthenticated, authLoading, setLocation]);

  const handleSave = async () => {
    try {
      // Preparar dados para envio (sem email)
      const updateData = {
        name: formData.name,
        birthDate: formData.birthDate || undefined,
        cpf: formData.cpf || undefined,
      };
      
      const response = await authAPI.updateProfile(updateData);
      
      // Atualizar contexto de autenticação sem recarregar a página
      if (response.user) {
        // Atualizar o contexto diretamente
        updateUser(response.user);
        // Atualizar formData com resposta do servidor
        setFormData({
          name: response.user.name,
          email: response.user.email,
          birthDate: response.user.birthDate 
            ? new Date(response.user.birthDate).toISOString().split('T')[0]
            : '',
          cpf: response.user.cpf || '',
        });
      }
      
      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        birthDate: user.birthDate 
          ? new Date(user.birthDate).toISOString().split('T')[0]
          : '',
        cpf: user.cpf || '',
      });
    }
    setIsEditing(false);
  };

  const formatCPF = (value: string) => {
    const cpf = value.replace(/\D/g, '');
    if (cpf.length <= 11) {
      if (cpf.length <= 3) return cpf;
      if (cpf.length <= 6) return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
      if (cpf.length <= 9) return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
      return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
    }
    return value.slice(0, 14); // Limitar a 14 caracteres (11 dígitos + 3 formatação)
  };

  const handleChangePassword = async () => {
    // Validações
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('A nova senha deve ser diferente da senha atual');
      return;
    }

    setIsChangingPassword(true);

    try {
      await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Senha alterada com sucesso!');
      setIsChangePasswordOpen(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error('Erro ao alterar senha', {
        description: error.response?.data?.error || 'Verifique a senha atual e tente novamente.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <p className="text-gray-600 dark:text-gray-300">Carregando perfil...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const quickActions = [
    {
      icon: Package,
      label: 'Meus Pedidos',
      description: `${stats.ordersCount} pedidos`,
      href: '/orders',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: Heart,
      label: 'Lista de Desejos',
      description: `${stats.wishlistCount} itens`,
      href: '/wishlist',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      icon: MapPin,
      label: 'Endereços',
      description: `${stats.addressesCount} endereços`,
      href: '/addresses',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: MessageSquare,
      label: 'Suporte',
      description: `${stats.ticketsCount} tickets`,
      href: '/tickets',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-sky-500 dark:text-sky-400" style={{ fontSize: '2.5rem', fontWeight: 900 }}>
          Meu Perfil
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Gerencie suas informações e preferências
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informações do Perfil */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Pessoais */}
          <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-gray-900 dark:text-gray-100">Informações Pessoais</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Seus dados de cadastro
                </CardDescription>
              </div>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                      Nome Completo
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="mt-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      O email não pode ser alterado
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="birthDate" className="text-gray-700 dark:text-gray-300">
                      Data de Aniversário
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      className="mt-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf" className="text-gray-700 dark:text-gray-300">
                      CPF
                    </Label>
                    <Input
                      id="cpf"
                      type="text"
                      value={formData.cpf}
                      onChange={(e) => {
                        const formatted = formatCPF(e.target.value);
                        setFormData({ ...formData, cpf: formatted });
                      }}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="mt-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    />
                    {formData.cpf && formData.cpf.replace(/\D/g, '').length !== 11 && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                        CPF deve conter 11 dígitos
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} className="flex-1">
                      <Save className="mr-2 h-4 w-4" />
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={handleCancel} className="flex-1">
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Informações do Usuário */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30 flex-shrink-0">
                      <User className="h-8 w-8 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                    </div>
                  </div>
                  
                  <Separator className="dark:bg-gray-700" />
                  
                  {/* Informações Detalhadas */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 py-2">
                      <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Email</p>
                        <p className="text-base text-gray-900 dark:text-gray-100 break-all">{user.email}</p>
                      </div>
                    </div>
                    
                    {user.birthDate && (
                      <div className="flex items-start gap-3 py-2">
                        <Cake className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Data de Aniversário</p>
                          <p className="text-base text-gray-900 dark:text-gray-100">
                            {new Date(user.birthDate).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {user.cpf && (
                      <div className="flex items-start gap-3 py-2">
                        <CreditCard className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">CPF</p>
                          <p className="text-base text-gray-900 dark:text-gray-100">
                            {(() => {
                              const cpfDigits = user.cpf.replace(/\D/g, '');
                              if (cpfDigits.length === 11) {
                                return cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                              }
                              return user.cpf;
                            })()}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3 py-2">
                      <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Membro desde</p>
                        <p className="text-base text-gray-900 dark:text-gray-100">
                          {new Date(user.createdAt || Date.now()).toLocaleDateString('pt-BR', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Shield className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                Segurança
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Gerencie sua segurança e privacidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Autenticação de Dois Fatores (2FA)</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.isTwoFactorEnabled ? 'Protegido com 2FA' : 'Não ativado'}
                    </p>
                  </div>
                  <Badge variant={user.isTwoFactorEnabled ? 'default' : 'outline'}>
                    {user.isTwoFactorEnabled ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Alterar Senha
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Alterar Senha</DialogTitle>
                      <DialogDescription>
                        Digite sua senha atual e a nova senha desejada.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="currentPassword">Senha Atual</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="mt-2"
                          placeholder="Digite sua senha atual"
                          disabled={isChangingPassword}
                        />
                      </div>
                      <div>
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="mt-2"
                          placeholder="Digite a nova senha"
                          disabled={isChangingPassword}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Mínimo de 6 caracteres
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="mt-2"
                          placeholder="Confirme a nova senha"
                          disabled={isChangingPassword}
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleChangePassword}
                          disabled={isChangingPassword}
                          className="flex-1"
                        >
                          {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsChangePasswordOpen(false);
                            setPasswordData({
                              currentPassword: '',
                              newPassword: '',
                              confirmPassword: '',
                            });
                          }}
                          disabled={isChangingPassword}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Ações Rápidas */}
        <div className="space-y-6">
          {/* Estatísticas Rápidas */}
          <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-700 dark:text-gray-300">Pedidos</span>
                  </div>
                  <Badge variant="outline">{stats.ordersCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className="text-gray-700 dark:text-gray-300">Wishlist</span>
                  </div>
                  <Badge variant="outline">{stats.wishlistCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">Endereços</span>
                  </div>
                  <Badge variant="outline">{stats.addressesCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-gray-700 dark:text-gray-300">Tickets</span>
                  </div>
                  <Badge variant="outline">{stats.ticketsCount}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.href}
                      variant="ghost"
                      onClick={() => setLocation(action.href)}
                      className="w-full justify-start gap-3 h-auto py-3 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.bgColor}`}>
                        <Icon className={`h-5 w-5 ${action.color}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{action.label}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{action.description}</p>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


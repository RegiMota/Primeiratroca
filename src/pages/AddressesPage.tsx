// Página de Gerenciamento de Endereços
// Versão 2.0 - Sistema de Frete e Entregas

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { addressesAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Check,
  Home,
  Briefcase,
  MapPinned,
  Search,
} from 'lucide-react';

interface Address {
  id: number;
  label?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  reference?: string;
  isDefault: boolean;
  recipientName?: string;
  phone?: string;
}

const ADDRESS_LABELS = {
  home: { icon: Home, label: 'Casa', color: 'text-blue-600' },
  work: { icon: Briefcase, label: 'Trabalho', color: 'text-purple-600' },
  other: { icon: MapPinned, label: 'Outro', color: 'text-gray-600' },
};

export function AddressesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'BR',
    reference: '',
    isDefault: false,
    recipientName: '',
    phone: '',
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

    loadAddresses();
  }, [isAuthenticated, authLoading, setLocation]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await addressesAPI.getAll();
      setAddresses(response.addresses || response || []);
    } catch (error: any) {
      console.error('Error loading addresses:', error);
      toast.error('Erro ao carregar endereços', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Formatar CEP automaticamente
    if (field === 'zipCode') {
      const formatted = value
        .toString()
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 10);
      setFormData((prev) => ({ ...prev, zipCode: formatted }));
    }

    // Formatar telefone automaticamente
    if (field === 'phone') {
      const formatted = value
        .toString()
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 15);
      setFormData((prev) => ({ ...prev, phone: formatted }));
    }
  };

  // Buscar endereço por CEP usando ViaCEP
  const searchCEP = async (cep: string) => {
    const cepDigits = cep.replace(/\D/g, '');
    
    if (cepDigits.length !== 8) {
      toast.error('CEP inválido', {
        description: 'O CEP deve conter 8 dígitos',
      });
      return;
    }

    setLoadingCEP(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado', {
          description: 'Por favor, verifique o CEP e tente novamente.',
        });
        return;
      }

      // Preencher campos automaticamente
      setFormData(prev => ({
        ...prev,
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
        zipCode: cepDigits.replace(/(\d{5})(\d{3})/, '$1-$2'),
      }));

      toast.success('Endereço encontrado!', {
        description: 'Os campos foram preenchidos automaticamente.',
      });
    } catch (error) {
      console.error('Error searching CEP:', error);
      toast.error('Erro ao buscar CEP', {
        description: 'Tente novamente mais tarde.',
      });
    } finally {
      setLoadingCEP(false);
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'BR',
      reference: '',
      isDefault: false,
      recipientName: '',
      phone: '',
    });
    setEditingAddress(null);
  };

  const handleOpenDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        label: address.label || '',
        street: address.street,
        number: address.number,
        complement: address.complement || '',
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country || 'BR',
        reference: address.reference || '',
        isDefault: address.isDefault,
        recipientName: address.recipientName || '',
        phone: address.phone || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    if (!formData.street || !formData.number || !formData.neighborhood || !formData.city || !formData.state || !formData.zipCode) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar CEP (formato brasileiro: 00000-000)
    const zipCodeRegex = /^\d{5}-?\d{3}$/;
    if (!zipCodeRegex.test(formData.zipCode.replace(/-/g, ''))) {
      toast.error('CEP inválido');
      return;
    }

    // Validar estado (2 letras)
    if (formData.state.length !== 2) {
      toast.error('Estado deve ter 2 letras (ex: SP, RJ)');
      return;
    }

    try {
      if (editingAddress) {
        // Atualizar endereço existente
        await addressesAPI.update(editingAddress.id, formData);
        toast.success('Endereço atualizado com sucesso!');
      } else {
        // Criar novo endereço
        await addressesAPI.create(formData);
        toast.success('Endereço adicionado com sucesso!');
      }

      handleCloseDialog();
      loadAddresses();
    } catch (error: any) {
      console.error('Error saving address:', error);
      toast.error('Erro ao salvar endereço', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este endereço?')) {
      return;
    }

    try {
      await addressesAPI.delete(id);
      toast.success('Endereço excluído com sucesso!');
      loadAddresses();
    } catch (error: any) {
      console.error('Error deleting address:', error);
      toast.error('Erro ao excluir endereço', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await addressesAPI.setDefault(id);
      toast.success('Endereço padrão atualizado!');
      loadAddresses();
    } catch (error: any) {
      console.error('Error setting default address:', error);
      toast.error('Erro ao definir endereço padrão', {
        description: error.response?.data?.error || 'Tente novamente mais tarde.',
      });
    }
  };

  const getLabelInfo = (label?: string) => {
    if (!label) return ADDRESS_LABELS.other;
    const key = label.toLowerCase() as keyof typeof ADDRESS_LABELS;
    return ADDRESS_LABELS[key] || ADDRESS_LABELS.other;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-sky-500" style={{ fontSize: '2.5rem', fontWeight: 900 }}>
          Meus Endereços
        </h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Endereço
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando endereços...</p>
        </div>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Você ainda não tem endereços cadastrados</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeiro Endereço
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => {
            const labelInfo = getLabelInfo(address.label);
            const LabelIcon = labelInfo.icon;
            return (
              <Card key={address.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <LabelIcon className={`h-5 w-5 ${labelInfo.color}`} />
                      <CardTitle className="text-lg">
                        {labelInfo.label || 'Endereço'}
                      </CardTitle>
                    </div>
                    {address.isDefault && (
                      <Badge className="bg-green-100 text-green-800">
                        <Check className="mr-1 h-3 w-3" />
                        Padrão
                      </Badge>
                    )}
                  </div>
                  {address.recipientName && (
                    <CardDescription>
                      {address.recipientName}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">
                      {address.street}, {address.number}
                    </p>
                    {address.complement && (
                      <p className="text-gray-500">{address.complement}</p>
                    )}
                    <p>
                      {address.neighborhood} - {address.city}/{address.state}
                    </p>
                    <p className="text-gray-500">CEP: {address.zipCode}</p>
                    {address.phone && (
                      <p className="text-gray-500">Tel: {address.phone}</p>
                    )}
                    {address.reference && (
                      <p className="text-xs text-gray-400 mt-2">
                        Referência: {address.reference}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    {!address.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                        className="flex-1"
                      >
                        Definir como Padrão
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(address)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(address.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog para Adicionar/Editar Endereço */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Editar Endereço' : 'Adicionar Endereço'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do endereço de entrega
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Tipo de Endereço */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="label">Tipo de Endereço</Label>
                  <select
                    id="label"
                    value={formData.label}
                    onChange={(e) => handleInputChange('label', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Selecione...</option>
                    <option value="home">Casa</option>
                    <option value="work">Trabalho</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="recipientName">
                    Nome do Destinatário (opcional)
                  </Label>
                  <Input
                    id="recipientName"
                    value={formData.recipientName}
                    onChange={(e) => handleInputChange('recipientName', e.target.value)}
                    placeholder="Se diferente do seu nome"
                  />
                </div>
              </div>

              {/* CEP e Estado */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="zipCode">CEP *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      required
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const cepDigits = formData.zipCode.replace(/\D/g, '');
                          if (cepDigits.length === 8) {
                            searchCEP(formData.zipCode);
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => searchCEP(formData.zipCode)}
                      disabled={loadingCEP || formData.zipCode.replace(/\D/g, '').length !== 8}
                      className="px-3 sm:px-4"
                      variant="outline"
                      title="Buscar endereço pelo CEP"
                    >
                      {loadingCEP ? (
                        <span className="text-xs">...</span>
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="state">Estado (UF) *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                    placeholder="SP"
                    maxLength={2}
                    required
                  />
                </div>
              </div>

              {/* Cidade e Bairro */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="São Paulo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    placeholder="Centro"
                    required
                  />
                </div>
              </div>

              {/* Rua e Número */}
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <div>
                  <Label htmlFor="street">Rua/Logradouro *</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    placeholder="Rua Exemplo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    placeholder="123"
                    required
                  />
                </div>
              </div>

              {/* Complemento */}
              <div>
                <Label htmlFor="complement">Complemento (opcional)</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => handleInputChange('complement', e.target.value)}
                  placeholder="Apto 101, Bloco A, etc."
                />
              </div>

              {/* Telefone */}
              <div>
                <Label htmlFor="phone">Telefone de Contato (opcional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(66) 99676-8065"
                  maxLength={15}
                />
              </div>

              {/* Referência */}
              <div>
                <Label htmlFor="reference">Ponto de Referência (opcional)</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => handleInputChange('reference', e.target.value)}
                  placeholder="Próximo ao mercado, etc."
                />
              </div>

              {/* Endereço Padrão */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isDefault" className="cursor-pointer">
                  Definir como endereço padrão
                </Label>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingAddress ? 'Salvar Alterações' : 'Adicionar Endereço'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}



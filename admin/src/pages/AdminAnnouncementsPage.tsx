import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { announcementsAPI } from '../lib/api';
import { Plus, Edit, Trash2, Image as ImageIcon, AlertCircle, Info, Gift, Bell } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';

interface Announcement {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  link?: string;
  type: string;
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  promo: { label: 'Promoção', icon: Gift, color: 'bg-purple-100 text-purple-800 border-purple-300' },
  alert: { label: 'Alerta', icon: AlertCircle, color: 'bg-red-100 text-red-800 border-red-300' },
  info: { label: 'Informação', icon: Info, color: 'bg-blue-100 text-blue-800 border-blue-300' },
  warning: { label: 'Aviso', icon: Bell, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
};

export function AdminAnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    type: 'info',
    isActive: true,
    order: 0,
    startDate: '',
    endDate: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementsAPI.getAll();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
      toast.error('Erro ao carregar avisos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData({ ...formData, imageUrl: base64String });
      setImagePreview(base64String);
    };
    reader.onerror = () => {
      toast.error('Erro ao ler o arquivo');
    };
    reader.readAsDataURL(file);
  };

  const handleOpenDialog = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        description: announcement.description || '',
        imageUrl: announcement.imageUrl || '',
        link: announcement.link || '',
        type: announcement.type,
        isActive: announcement.isActive,
        order: announcement.order,
        startDate: announcement.startDate ? announcement.startDate.split('T')[0] : '',
        endDate: announcement.endDate ? announcement.endDate.split('T')[0] : '',
      });
      setImagePreview(announcement.imageUrl || null);
    } else {
      setEditingAnnouncement(null);
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        link: '',
        type: 'info',
        isActive: true,
        order: 0,
        startDate: '',
        endDate: '',
      });
      setImagePreview(null);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      link: '',
      type: 'info',
      isActive: true,
      order: 0,
      startDate: '',
      endDate: '',
    });
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    try {
      if (editingAnnouncement) {
        await announcementsAPI.update(editingAnnouncement.id, {
          ...formData,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
        });
        toast.success('Aviso atualizado com sucesso!');
      } else {
        await announcementsAPI.create({
          ...formData,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
        });
        toast.success('Aviso criado com sucesso!');
      }
      handleCloseDialog();
      loadAnnouncements();
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar aviso');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este aviso?')) {
      return;
    }

    try {
      await announcementsAPI.delete(id);
      toast.success('Aviso excluído com sucesso!');
      loadAnnouncements();
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      toast.error(error.response?.data?.error || 'Erro ao excluir aviso');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Avisos e Promoções</h1>
          <p className="mt-2 text-gray-600">Gerencie os avisos e promoções exibidos no site</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Aviso
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Carregando avisos...</p>
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-600">Nenhum aviso cadastrado</p>
            <Button onClick={() => handleOpenDialog()} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Aviso
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {announcements.map((announcement) => {
            const TypeIcon = typeConfig[announcement.type]?.icon || Info;
            const typeInfo = typeConfig[announcement.type] || typeConfig.info;

            return (
              <Card key={announcement.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-5 w-5" />
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    </div>
                    <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                  </div>
                  {announcement.description && (
                    <CardDescription className="mt-2">{announcement.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {announcement.imageUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={announcement.imageUrl}
                        alt={announcement.title}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Status:</span>
                      <Badge variant={announcement.isActive ? 'default' : 'secondary'}>
                        {announcement.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Ordem:</span>
                      <span className="font-semibold">{announcement.order}</span>
                    </div>
                    {announcement.startDate && (
                      <div>
                        <span className="font-medium">Início:</span>{' '}
                        {formatDate(announcement.startDate)}
                      </div>
                    )}
                    {announcement.endDate && (
                      <div>
                        <span className="font-medium">Fim:</span> {formatDate(announcement.endDate)}
                      </div>
                    )}
                    {announcement.link && (
                      <div>
                        <span className="font-medium">Link:</span>{' '}
                        <a
                          href={announcement.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {announcement.link}
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(announcement)}
                      className="flex-1"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(announcement.id)}
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

      {/* Dialog de criação/edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? 'Editar Aviso' : 'Novo Aviso'}
            </DialogTitle>
            <DialogDescription>
              {editingAnnouncement
                ? 'Edite as informações do aviso'
                : 'Preencha os dados para criar um novo aviso'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Promoção de Verão"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do aviso ou promoção"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promo">Promoção</SelectItem>
                    <SelectItem value="alert">Alerta</SelectItem>
                    <SelectItem value="info">Informação</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="order">Ordem</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="image">Imagem</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              {imagePreview && (
                <div className="mt-2 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="link">Link (opcional)</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://exemplo.com/promocao"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data de Início (opcional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="endDate">Data de Fim (opcional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Aviso ativo</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingAnnouncement ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


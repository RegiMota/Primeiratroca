// Página para gerenciar conteúdo da página principal (Carrossel e Cards de Benefícios)
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { heroSlidesAPI, benefitCardsAPI, uploadAPI } from '../lib/api';
import { 
  Image, Video, FileImage, Trash2, Edit, Plus, ArrowUp, ArrowDown,
  Send, RefreshCw, CreditCard, Package, Truck, Shield, Heart, Star
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ImageUploader } from '../components/ImageUploader';
import { toast } from 'sonner';

// Ícones disponíveis para os cards de benefícios
const availableIcons: { name: string; component: React.ComponentType<{ className?: string }> }[] = [
  { name: 'Send', component: Send },
  { name: 'RefreshCw', component: RefreshCw },
  { name: 'CreditCard', component: CreditCard },
  { name: 'Package', component: Package },
  { name: 'Truck', component: Truck },
  { name: 'Shield', component: Shield },
  { name: 'Heart', component: Heart },
  { name: 'Star', component: Star },
];

interface HeroSlide {
  id: number;
  title?: string;
  subtitle?: string;
  description?: string;
  price?: string;
  originalPrice?: string;
  buttonText: string;
  buttonLink: string;
  mediaUrl?: string;
  mediaType?: string;
  order: number;
  isActive: boolean;
}

interface BenefitCard {
  id: number;
  iconName?: string | null;
  imageUrl?: string | null;
  mainText: string;
  subText: string;
  color?: string | null;
  link?: string | null;
  order: number;
  isActive: boolean;
}

export function AdminContentPage() {
  const { user } = useAuth();
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [benefitCards, setBenefitCards] = useState<BenefitCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [editingCard, setEditingCard] = useState<BenefitCard | null>(null);
  const [isSlideDialogOpen, setIsSlideDialogOpen] = useState(false);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [slideFormData, setSlideFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    price: '',
    originalPrice: '',
    buttonText: '',
    buttonLink: '',
    mediaUrl: '',
    mediaType: 'image',
    order: 0,
    isActive: true,
  });
  const [mediaInputMode, setMediaInputMode] = useState<'url' | 'upload'>('url');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [cardFormData, setCardFormData] = useState({
    iconName: 'Send',
    imageUrl: '',
    mainText: '',
    subText: '',
    color: '#FF6B35',
    link: '',
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [slides, cards] = await Promise.all([
        heroSlidesAPI.getAll(),
        benefitCardsAPI.getAll(),
      ]);
      setHeroSlides(slides);
      setBenefitCards(cards);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlide = () => {
    setEditingSlide(null);
    setSlideFormData({
      title: '',
      subtitle: '',
      description: '',
      price: '',
      originalPrice: '',
      buttonText: '',
      buttonLink: '',
      mediaUrl: '',
      mediaType: 'image',
      order: heroSlides.length,
      isActive: true,
    });
    setMediaInputMode('url');
    setMediaFile(null);
    setMediaPreview(null);
    setIsSlideDialogOpen(true);
  };

  const handleEditSlide = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setSlideFormData({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      price: slide.price || '',
      originalPrice: slide.originalPrice || '',
      buttonText: slide.buttonText,
      buttonLink: slide.buttonLink,
      mediaUrl: slide.mediaUrl || '',
      mediaType: slide.mediaType || 'image',
      order: slide.order,
      isActive: slide.isActive,
    });
    // Detectar se é URL local (upload) ou externa
    const isLocalUpload = slide.mediaUrl?.startsWith('/uploads/');
    setMediaInputMode(isLocalUpload ? 'upload' : 'url');
    setMediaFile(null);
    setMediaPreview(slide.mediaUrl || null);
    setIsSlideDialogOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Apenas imagens, vídeos e GIFs são aceitos.');
      return;
    }

    // Validar tamanho (100MB máximo)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Tamanho máximo: 100MB');
      return;
    }

    setMediaFile(file);
    
    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSlide = async () => {
    try {
      if (!slideFormData.buttonText || !slideFormData.buttonLink) {
        toast.error('Texto do botão e link são obrigatórios');
        return;
      }

      // Mostrar loading
      const loadingToast = toast.loading('Salvando slide...');

      let finalMediaUrl = slideFormData.mediaUrl;
      let finalMediaType = slideFormData.mediaType;

      // Se foi selecionado um arquivo para upload
      if (mediaInputMode === 'upload' && mediaFile) {
        setUploadingMedia(true);
        try {
          const uploadResult = await uploadAPI.uploadMedia(mediaFile);
          finalMediaUrl = uploadResult.url;
          finalMediaType = detectMediaType(uploadResult.url);
          toast.dismiss(loadingToast);
          toast.loading('Salvando slide...', { id: loadingToast });
        } catch (uploadError: any) {
          toast.dismiss(loadingToast);
          toast.error(uploadError.message || 'Erro ao fazer upload do arquivo');
          setUploadingMedia(false);
          return;
        }
        setUploadingMedia(false);
      } else if (mediaInputMode === 'url' && slideFormData.mediaUrl) {
        // Se é URL, detectar tipo
        finalMediaType = detectMediaType(slideFormData.mediaUrl);
      }

      const slideData = {
        ...slideFormData,
        mediaUrl: finalMediaUrl || undefined,
        mediaType: finalMediaType,
      };

      if (editingSlide) {
        await heroSlidesAPI.update(editingSlide.id, slideData);
        toast.dismiss(loadingToast);
        toast.success('Slide atualizado com sucesso');
      } else {
        await heroSlidesAPI.create(slideData);
        toast.dismiss(loadingToast);
        toast.success('Slide criado com sucesso');
      }
      setIsSlideDialogOpen(false);
      setMediaFile(null);
      setMediaPreview(null);
      await loadData();
    } catch (error) {
      console.error('Error saving slide:', error);
      const axiosError = error as { code?: string; message?: string; response?: { status?: number; data?: { error?: string } } };
      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        toast.error('Operação demorou muito (mais de 60 segundos). Verifique se o servidor está respondendo e tente novamente. Se o problema persistir, verifique a conexão com o banco de dados.');
      } else if (axiosError.response?.status === 404) {
        toast.error('Slide não encontrado');
      } else if (axiosError.response?.status === 400) {
        toast.error(axiosError.response?.data?.error || 'Dados inválidos');
      } else if (axiosError.response?.status === 500) {
        toast.error('Erro no servidor. Verifique os logs do servidor para mais detalhes.');
      } else {
        toast.error(axiosError.response?.data?.error || 'Erro ao salvar slide');
      }
      setUploadingMedia(false);
    }
  };

  const handleDeleteSlide = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este slide?')) return;

    try {
      await heroSlidesAPI.delete(id);
      toast.success('Slide removido com sucesso');
      await loadData();
    } catch (error) {
      console.error('Error deleting slide:', error);
      const axiosError = error as { code?: string; message?: string; response?: { status?: number; data?: { error?: string } } };
      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        toast.error('Operação demorou muito. Tente novamente.');
      } else if (axiosError.response?.status === 404) {
        toast.error('Slide não encontrado');
      } else {
        toast.error(axiosError.response?.data?.error || 'Erro ao remover slide');
      }
    }
  };

  const handleCreateCard = () => {
    setEditingCard(null);
    setCardFormData({
      iconName: 'Send',
      imageUrl: '',
      mainText: '',
      subText: '',
      color: '#FF6B35',
      link: '',
      order: benefitCards.length,
      isActive: true,
    });
    setIsCardDialogOpen(true);
  };

  const handleEditCard = (card: BenefitCard) => {
    setEditingCard(card);
    setCardFormData({
      iconName: card.iconName || 'Send',
      imageUrl: card.imageUrl || '',
      mainText: card.mainText,
      subText: card.subText,
      color: card.color || '#FF6B35',
      link: card.link || '',
      order: card.order,
      isActive: card.isActive,
    });
    setIsCardDialogOpen(true);
  };

  const handleSaveCard = async () => {
    try {
      // Validar que tem ícone OU imagem
      if ((!cardFormData.iconName && !cardFormData.imageUrl) || !cardFormData.mainText || !cardFormData.subText) {
        toast.error('Ícone ou imagem, texto principal e texto secundário são obrigatórios');
        return;
      }

      // Mostrar loading
      const loadingToast = toast.loading('Salvando card...');

      if (editingCard) {
        await benefitCardsAPI.update(editingCard.id, cardFormData);
        toast.dismiss(loadingToast);
        toast.success('Card atualizado com sucesso');
      } else {
        await benefitCardsAPI.create(cardFormData);
        toast.dismiss(loadingToast);
        toast.success('Card criado com sucesso');
      }
      setIsCardDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error('Error saving card:', error);
      const axiosError = error as { code?: string; message?: string; response?: { status?: number; data?: { error?: string } } };
      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        toast.error('Operação demorou muito (mais de 60 segundos). Verifique se o servidor está respondendo e tente novamente. Se o problema persistir, verifique a conexão com o banco de dados.');
      } else if (axiosError.response?.status === 404) {
        toast.error('Card não encontrado');
      } else if (axiosError.response?.status === 400) {
        toast.error(axiosError.response?.data?.error || 'Dados inválidos');
      } else if (axiosError.response?.status === 500) {
        toast.error('Erro no servidor. Verifique os logs do servidor para mais detalhes.');
      } else {
        toast.error(axiosError.response?.data?.error || 'Erro ao salvar card');
      }
    }
  };

  const handleDeleteCard = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este card?')) return;

    try {
      await benefitCardsAPI.delete(id);
      toast.success('Card removido com sucesso');
      await loadData();
    } catch (error) {
      console.error('Error deleting card:', error);
      const axiosError = error as { code?: string; message?: string; response?: { status?: number; data?: { error?: string } } };
      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        toast.error('Operação demorou muito. Tente novamente.');
      } else if (axiosError.response?.status === 404) {
        toast.error('Card não encontrado');
      } else {
        toast.error(axiosError.response?.data?.error || 'Erro ao remover card');
      }
    }
  };

  const detectMediaType = (url: string): 'image' | 'video' | 'gif' => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.ogg') || lowerUrl.includes('.mov')) {
      return 'video';
    }
    if (lowerUrl.includes('.gif')) {
      return 'gif';
    }
    return 'image';
  };

  const handleMediaUrlChange = (url: string) => {
    setSlideFormData({
      ...slideFormData,
      mediaUrl: url,
      mediaType: url ? detectMediaType(url) : 'image',
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conteúdo da Página Principal</h1>
          <p className="text-gray-600 mt-1">Gerencie o carrossel e os cards de benefícios</p>
        </div>
      </div>

      <Tabs defaultValue="carousel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="carousel">Carrossel</TabsTrigger>
          <TabsTrigger value="benefits">Cards de Benefícios</TabsTrigger>
        </TabsList>

        {/* TAB: CARROSSEL */}
        <TabsContent value="carousel" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Slides do Carrossel</h2>
            <Button onClick={handleCreateSlide}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Slide
            </Button>
          </div>

          {heroSlides.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Image className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-600">Nenhum slide encontrado</p>
                <Button onClick={handleCreateSlide} className="mt-4">
                  Criar Primeiro Slide
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {heroSlides.map((slide) => (
                <Card key={slide.id} className={!slide.isActive ? 'opacity-50' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{slide.title || 'Sem título'}</CardTitle>
                        <CardDescription>Ordem: {slide.order}</CardDescription>
                      </div>
                      <Badge variant={slide.isActive ? 'default' : 'secondary'}>
                        {slide.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {slide.mediaUrl && (
                      <div className="relative h-32 w-full overflow-hidden rounded-lg bg-gray-100">
                        {slide.mediaType === 'video' ? (
                          <video
                            src={slide.mediaUrl}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={slide.mediaUrl}
                            alt={slide.title || 'Slide'}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                    )}
                    <div className="space-y-1 text-sm">
                      <p><strong>Botão:</strong> {slide.buttonText}</p>
                      <p><strong>Link:</strong> {slide.buttonLink}</p>
                      {slide.mediaType && (
                        <p><strong>Tipo:</strong> {slide.mediaType}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSlide(slide)}
                        className="flex-1"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSlide(slide.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB: CARDS DE BENEFÍCIOS */}
        <TabsContent value="benefits" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Cards de Benefícios</h2>
            <Button onClick={handleCreateCard}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Card
            </Button>
          </div>

          {benefitCards.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-600">Nenhum card encontrado</p>
                <Button onClick={handleCreateCard} className="mt-4">
                  Criar Primeiro Card
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {benefitCards.map((card) => {
                const IconComponent = card.iconName ? (availableIcons.find(i => i.name === card.iconName)?.component || Send) : null;
                return (
                  <Card key={card.id} className={!card.isActive ? 'opacity-50' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {card.imageUrl ? (
                            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                              <img 
                                src={card.imageUrl} 
                                alt={card.mainText}
                                className="object-contain"
                                style={{ width: '48px', height: '48px', maxWidth: '48px', maxHeight: '48px', objectFit: 'contain' }}
                              />
                            </div>
                          ) : IconComponent ? (
                            <IconComponent className="h-6 w-6 text-gray-600 flex-shrink-0" />
                          ) : null}
                          <div>
                            <CardTitle className="text-lg">{card.mainText}</CardTitle>
                            <CardDescription>Ordem: {card.order}</CardDescription>
                          </div>
                        </div>
                        <Badge variant={card.isActive ? 'default' : 'secondary'}>
                          {card.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600">{card.subText}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCard(card)}
                          className="flex-1"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCard(card.id)}
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
        </TabsContent>
      </Tabs>

      {/* DIALOG: EDITAR SLIDE */}
      <Dialog open={isSlideDialogOpen} onOpenChange={setIsSlideDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSlide ? 'Editar Slide' : 'Novo Slide'}</DialogTitle>
            <DialogDescription>
              Configure o conteúdo do slide do carrossel
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título (Opcional)</Label>
                <Input
                  id="title"
                  value={slideFormData.title}
                  onChange={(e) => setSlideFormData({ ...slideFormData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="subtitle">Subtítulo (Opcional)</Label>
                <Input
                  id="subtitle"
                  value={slideFormData.subtitle}
                  onChange={(e) => setSlideFormData({ ...slideFormData, subtitle: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea
                id="description"
                value={slideFormData.description}
                onChange={(e) => setSlideFormData({ ...slideFormData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Preço (Opcional)</Label>
                <Input
                  id="price"
                  value={slideFormData.price}
                  onChange={(e) => setSlideFormData({ ...slideFormData, price: e.target.value })}
                  placeholder="119"
                />
              </div>
              <div>
                <Label htmlFor="originalPrice">Preço Original (Opcional)</Label>
                <Input
                  id="originalPrice"
                  value={slideFormData.originalPrice}
                  onChange={(e) => setSlideFormData({ ...slideFormData, originalPrice: e.target.value })}
                  placeholder="149"
                />
              </div>
              <div>
                <Label htmlFor="order">Ordem</Label>
                <Input
                  id="order"
                  type="number"
                  value={slideFormData.order}
                  onChange={(e) => setSlideFormData({ ...slideFormData, order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label>Mídia (Imagem, Vídeo ou GIF)</Label>
              
              {/* Tabs para escolher entre URL ou Upload */}
              <Tabs value={mediaInputMode} onValueChange={(value) => {
                setMediaInputMode(value as 'url' | 'upload');
                if (value === 'upload') {
                  setSlideFormData({ ...slideFormData, mediaUrl: '' });
                } else {
                  setMediaFile(null);
                  setMediaPreview(null);
                }
              }} className="mt-2">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="url" className="cursor-pointer">🔗 URL</TabsTrigger>
                  <TabsTrigger value="upload" className="cursor-pointer">📁 Upload do Computador</TabsTrigger>
                </TabsList>
                
                <TabsContent value="url" className="space-y-2">
                  <Input
                    id="mediaUrl"
                    value={slideFormData.mediaUrl}
                    onChange={(e) => handleMediaUrlChange(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                  <p className="text-xs text-gray-500">
                    Cole o link da imagem, vídeo ou GIF
                  </p>
                  {slideFormData.mediaUrl && (
                    <div className="mt-2 relative">
                      {slideFormData.mediaType === 'video' ? (
                        <video
                          src={slideFormData.mediaUrl}
                          className="w-full h-32 object-contain rounded border border-gray-300 bg-gray-50"
                          controls
                          muted
                        />
                      ) : (
                        <img
                          src={slideFormData.mediaUrl}
                          alt="Preview"
                          className="w-full h-32 object-contain rounded border border-gray-300 bg-gray-50"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="upload" className="space-y-2">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <Input
                      id="mediaFile"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      disabled={uploadingMedia}
                      className="cursor-pointer hidden"
                    />
                    <Label htmlFor="mediaFile" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <FileImage className="h-12 w-12 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          Clique para selecionar um arquivo
                        </span>
                        <span className="text-xs text-gray-500">
                          ou arraste e solte aqui
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          Imagens, vídeos ou GIFs (máx. 100MB)
                        </span>
                      </div>
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Faça upload de uma imagem, vídeo ou GIF do seu computador
                  </p>
                  {mediaPreview && (
                    <div className="mt-2 relative">
                      {mediaFile?.type.startsWith('video/') ? (
                        <video
                          src={mediaPreview}
                          className="w-full h-32 object-contain rounded border border-gray-300 bg-gray-50"
                          controls
                          muted
                        />
                      ) : (
                        <img
                          src={mediaPreview}
                          alt="Preview"
                          className="w-full h-32 object-contain rounded border border-gray-300 bg-gray-50"
                        />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setMediaFile(null);
                          setMediaPreview(null);
                        }}
                        disabled={uploadingMedia}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {uploadingMedia && (
                    <p className="text-xs text-blue-600">Fazendo upload do arquivo...</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buttonText">Texto do Botão *</Label>
                <Input
                  id="buttonText"
                  value={slideFormData.buttonText}
                  onChange={(e) => setSlideFormData({ ...slideFormData, buttonText: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="buttonLink">Link do Botão *</Label>
                <Input
                  id="buttonLink"
                  value={slideFormData.buttonLink}
                  onChange={(e) => setSlideFormData({ ...slideFormData, buttonLink: e.target.value })}
                  placeholder="/shop?category=body"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="isActive">Ativo</Label>
                <p className="text-xs text-gray-500">Slide será exibido no carrossel</p>
              </div>
              <Switch
                id="isActive"
                checked={slideFormData.isActive}
                onCheckedChange={(checked) => setSlideFormData({ ...slideFormData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSlideDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSlide}>
              {editingSlide ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: EDITAR CARD */}
      <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCard ? 'Editar Card' : 'Novo Card'}</DialogTitle>
            <DialogDescription>
              Configure o card de benefício
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Ícone ou Imagem *</Label>
              <p className="text-xs text-gray-500 mb-2">Escolha um ícone ou faça upload de uma imagem</p>
              
              {/* Opção de Upload de Imagem */}
              <div className="mb-4">
                <Label htmlFor="imageUrl" className="text-sm font-normal">Imagem (opcional)</Label>
                {cardFormData.imageUrl ? (
                  <div className="mt-2 relative">
                    <img 
                      src={cardFormData.imageUrl} 
                      alt="Preview" 
                      className="w-full h-32 object-contain rounded border border-gray-300 bg-gray-50"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setCardFormData({ ...cardFormData, imageUrl: '', iconName: cardFormData.iconName || 'Send' })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <ImageUploader
                    onUpload={(base64) => {
                      setCardFormData({ ...cardFormData, imageUrl: base64, iconName: '' });
                    }}
                    maxSizeMB={5}
                    maxWidth={800}
                    maxHeight={600}
                  />
                )}
              </div>

              {/* Opção de Seleção de Ícone */}
              {!cardFormData.imageUrl && (
                <div>
                  <Label htmlFor="iconName">Ícone</Label>
                  <Select
                    value={cardFormData.iconName || 'Send'}
                    onValueChange={(value) => setCardFormData({ ...cardFormData, iconName: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableIcons.map((icon) => {
                        const IconComponent = icon.component;
                        return (
                          <SelectItem key={icon.name} value={icon.name}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {icon.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="mainText">Texto Principal *</Label>
              <Input
                id="mainText"
                value={cardFormData.mainText}
                onChange={(e) => setCardFormData({ ...cardFormData, mainText: e.target.value })}
                placeholder="Frete grátis"
                required
              />
            </div>

            <div>
              <Label htmlFor="subText">Texto Secundário *</Label>
              <Input
                id="subText"
                value={cardFormData.subText}
                onChange={(e) => setCardFormData({ ...cardFormData, subText: e.target.value })}
                placeholder="Para compras acima de R$ 299"
                required
              />
            </div>

            <div>
              <Label htmlFor="link">Link (Opcional)</Label>
              <Input
                id="link"
                value={cardFormData.link}
                onChange={(e) => setCardFormData({ ...cardFormData, link: e.target.value })}
                placeholder="https://exemplo.com ou /categoria/produtos"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL para redirecionar ao clicar no card. Pode ser um link externo ou interno (ex: /shop)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="order">Ordem</Label>
                <Input
                  id="order"
                  type="number"
                  value={cardFormData.order}
                  onChange={(e) => setCardFormData({ ...cardFormData, order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="color">Cor do Card (Hex)</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="text"
                    value={cardFormData.color}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Validar formato hex
                      if (value === '' || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setCardFormData({ ...cardFormData, color: value });
                      }
                    }}
                    placeholder="#FF6B35"
                    maxLength={7}
                    className="flex-1"
                  />
                  <div
                    className="w-12 h-10 rounded border-2 border-gray-300 cursor-pointer"
                    style={{ backgroundColor: cardFormData.color || '#FF6B35' }}
                    onClick={() => {
                      const input = document.getElementById('color') as HTMLInputElement;
                      input?.focus();
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Formato: #RRGGBB (ex: #FF6B35)
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="isActive">Ativo</Label>
                <p className="text-xs text-gray-500">Card será exibido na página</p>
              </div>
              <Switch
                id="isActive"
                checked={cardFormData.isActive}
                onCheckedChange={(checked) => setCardFormData({ ...cardFormData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCardDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCard}>
              {editingCard ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI, themeAPI } from '../lib/api';
import { Settings, Upload, Image as ImageIcon, Trash2, Palette, Code } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

export function AdminSettingsPage() {
  const { user } = useAuth();
  const [logo, setLogo] = useState<string | null>(null);
  const [logoLink, setLogoLink] = useState<string>('/');
  const [logoSize, setLogoSize] = useState<string>('150px');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        setLoading(true);
        const data = await adminAPI.getLogo();
        setLogo(data.logo);
        setLogoLink(data.logoLink || '/');
        setLogoSize(data.logoSize || '150px');
        setPreview(data.logo);
      } catch (error) {
        console.error('Error loading logo:', error);
        toast.error('Erro ao carregar logo');
      } finally {
        setLoading(false);
      }
    };

    loadLogo();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido (PNG, JPG, JPEG, SVG ou WebP)');
      return;
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    // Otimizar e converter para base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        // Criar canvas para redimensionar se necessário
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionar se for muito grande (máximo 800px de largura)
        const maxWidth = 800;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // Limitar altura também (máximo 300px)
        const maxHeight = 300;
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          // Converter para base64 mantendo o formato original ou convertendo para JPEG
          let base64String: string;
          if (file.type === 'image/svg+xml') {
            // Para SVG, usar o original (não pode ser processado pelo canvas)
            base64String = reader.result as string;
          } else if (file.type === 'image/webp') {
            // Para WebP, tentar manter o formato WebP ou converter para PNG
            try {
              // Tentar manter WebP se o navegador suportar
              base64String = canvas.toDataURL('image/webp', 0.9);
            } catch (error) {
              // Se não suportar WebP, converter para PNG
              base64String = canvas.toDataURL('image/png');
            }
          } else if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg') {
            // Usar JPEG com qualidade 0.85 para reduzir tamanho
            base64String = canvas.toDataURL('image/jpeg', 0.85);
          } else {
            // Para outros formatos, converter para PNG
            base64String = canvas.toDataURL('image/png');
          }
          
          setPreview(base64String);
        } else {
          // Fallback se canvas não funcionar - usar o original
          setPreview(reader.result as string);
        }
      };
      img.onerror = () => {
        toast.error('Erro ao processar a imagem');
      };
      img.src = reader.result as string;
    };
    reader.onerror = () => {
      toast.error('Erro ao ler o arquivo');
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) {
      toast.error('Por favor, selecione uma imagem primeiro');
      return;
    }

    try {
      setUploading(true);
      await adminAPI.updateLogo(preview, logoLink, logoSize);
      setLogo(preview);
      toast.success('Logo atualizada com sucesso!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(error?.response?.data?.error || 'Erro ao atualizar logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setUploading(true);
      await adminAPI.updateLogo('', logoLink, logoSize);
      setLogo(null);
      setPreview(null);
      toast.success('Logo removida com sucesso!');
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast.error('Erro ao remover logo');
    } finally {
      setUploading(false);
    }
  };


  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <p className="text-gray-600">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Configurações do Site
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie a identidade visual e configurações gerais da loja
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="logo" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logo" className="cursor-pointer">
            <ImageIcon className="mr-2 h-4 w-4" />
            Logo
          </TabsTrigger>
          <TabsTrigger value="favicon" className="cursor-pointer">
            <ImageIcon className="mr-2 h-4 w-4" />
            Favicon
          </TabsTrigger>
          <TabsTrigger value="styling" className="cursor-pointer relative z-10">
            <Palette className="mr-2 h-4 w-4" />
            Estilização
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logo" className="space-y-6">
          {/* Logo Section */}
          <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 shadow-md">
                <ImageIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Logo do Site
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Faça upload da logo que aparecerá no cabeçalho do site
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Informações sobre formato e tamanho */}
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 p-5 border-2 border-blue-200 dark:border-blue-800 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 dark:bg-blue-600 flex-shrink-0 shadow-md">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="font-bold text-blue-900 dark:text-blue-100 text-base">
                    Especificações da Logo
                  </p>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1.5 list-none">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold mt-0.5">•</span>
                      <span><strong>Formatos aceitos:</strong> PNG, JPG, JPEG, SVG ou WebP</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold mt-0.5">•</span>
                      <span><strong>Tamanho recomendado:</strong> 200x60 pixels (proporção 3.3:1)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold mt-0.5">•</span>
                      <span><strong>Tamanho máximo:</strong> 2MB</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold mt-0.5">•</span>
                      <span><strong>Formato ideal:</strong> PNG com fundo transparente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold mt-0.5">•</span>
                      <span><strong>Dimensões mínimas:</strong> 150x45 pixels</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold mt-0.5">•</span>
                      <span><strong>Dimensões máximas:</strong> 400x120 pixels</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Preview da logo atual */}
            {preview && (
              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Preview da Logo
                </Label>
                <div className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-sm">
                  <div className="flex items-center justify-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md border border-gray-200 dark:border-gray-700" style={{ minHeight: '80px' }}>
                    <img
                      src={preview}
                      alt="Logo preview"
                      style={{ 
                        height: logoSize || '150px', 
                        width: 'auto', 
                        maxWidth: '500px',
                        objectFit: 'contain'
                      }}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Esta é como a logo aparecerá no cabeçalho do site
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Tamanho atual: {logoSize || '150px'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Link: {logoLink || '/'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Link da Logo */}
            <div className="space-y-2">
              <Label htmlFor="logo-link">Link da Logo (onde redireciona ao clicar)</Label>
              <Input
                id="logo-link"
                type="text"
                value={logoLink}
                onChange={(e) => setLogoLink(e.target.value)}
                placeholder="/"
                className="mt-2"
              />
              <p className="text-xs text-gray-500">
                Ex: /, /shop, /home, ou URL externa como https://exemplo.com
              </p>
            </div>

            {/* Tamanho da Logo */}
            <div className="space-y-2">
              <Label htmlFor="logo-size">Tamanho da Logo</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="logo-size"
                  type="text"
                  value={logoSize}
                  onChange={(e) => setLogoSize(e.target.value)}
                  placeholder="150px"
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLogoSize('100px')}
                    className="text-xs"
                  >
                    100px
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLogoSize('150px')}
                    className="text-xs"
                  >
                    150px
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLogoSize('200px')}
                    className="text-xs"
                  >
                    200px
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Ex: 150px, 200px, 10rem, ou auto. Use valores CSS válidos.
              </p>
            </div>

            {/* Upload */}
            <div className="space-y-3">
              <Label htmlFor="logo-upload" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Nova Logo
              </Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                    onChange={handleFileSelect}
                    className="cursor-pointer border-2 border-gray-300 dark:border-gray-600 hover:border-sky-400 dark:hover:border-sky-500 transition-colors"
                    disabled={uploading}
                  />
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || (!preview && !logo)}
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all font-semibold px-6"
                  style={{ fontWeight: 700 }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
              {(preview && preview !== logo) || (logoLink !== '/' && logoLink !== '') || (logoSize !== '150px' && logoSize !== '') ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ Você tem alterações pendentes. Clique em "Salvar Configurações" para aplicar.
                </p>
              ) : null}
            </div>

            {/* Remover */}
            {logo && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={handleRemove}
                  variant="outline"
                  disabled={uploading}
                  className="rounded-xl text-red-600 dark:text-red-400 border-2 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 hover:border-red-400 dark:hover:border-red-500 transition-all font-semibold"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover Logo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        </TabsContent>

        <TabsContent value="favicon" className="space-y-6">
          <FaviconSection />
        </TabsContent>

        <TabsContent value="styling">
          <StylingSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente para seção de favicon
function FaviconSection() {
  const [favicon, setFavicon] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadFavicon = async () => {
      try {
        setLoading(true);
        const data = await adminAPI.getFavicon();
        setFavicon(data.favicon);
        setPreview(data.favicon);
      } catch (error) {
        console.error('Error loading favicon:', error);
        toast.error('Erro ao carregar favicon');
      } finally {
        setLoading(false);
      }
    };

    loadFavicon();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo (favicon geralmente é .ico, mas aceitamos imagens)
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido (ICO, PNG, JPG, SVG)');
      return;
    }

    // Validar tamanho (máximo 500KB para favicon)
    if (file.size > 500 * 1024) {
      toast.error('O favicon deve ter no máximo 500KB');
      return;
    }

    // Converter para base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
    };
    reader.onerror = () => {
      toast.error('Erro ao ler o arquivo');
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) {
      toast.error('Por favor, selecione uma imagem primeiro');
      return;
    }

    try {
      setUploading(true);
      await adminAPI.updateFavicon(preview);
      setFavicon(preview);
      
      // Atualizar o favicon na página
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = preview;
      document.getElementsByTagName('head')[0].appendChild(link);
      
      toast.success('Favicon atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error uploading favicon:', error);
      toast.error(error?.response?.data?.error || 'Erro ao atualizar favicon');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setUploading(true);
      await adminAPI.updateFavicon('');
      setFavicon(null);
      setPreview(null);
      
      // Remover o favicon da página
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.remove();
      }
      
      toast.success('Favicon removido com sucesso!');
    } catch (error: any) {
      console.error('Error removing favicon:', error);
      toast.error('Erro ao remover favicon');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Carregando favicon...</p>
      </div>
    );
  }

  return (
    <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 shadow-md">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Favicon do Site
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Faça upload do favicon que aparecerá na aba do navegador
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Informações sobre formato e tamanho */}
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 border-2 border-purple-200 dark:border-purple-800 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500 dark:bg-purple-600 flex-shrink-0 shadow-md">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="font-bold text-purple-900 dark:text-purple-100 text-base">
                Especificações do Favicon
              </p>
              <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1.5 list-none">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold mt-0.5">•</span>
                  <span><strong>Formatos aceitos:</strong> ICO, PNG, JPG, JPEG, SVG</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold mt-0.5">•</span>
                  <span><strong>Tamanho recomendado:</strong> 32x32 ou 16x16 pixels (quadrado)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold mt-0.5">•</span>
                  <span><strong>Tamanho máximo:</strong> 500KB</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 font-bold mt-0.5">•</span>
                  <span><strong>Formato ideal:</strong> ICO ou PNG com fundo transparente</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Preview do favicon atual */}
        {preview && (
          <div className="space-y-3">
            <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Preview do Favicon
            </Label>
            <div className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-sm">
              <div className="flex items-center justify-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md border border-gray-200 dark:border-gray-700" style={{ width: '64px', height: '64px' }}>
                <img
                  src={preview}
                  alt="Favicon preview"
                  style={{ 
                    width: '32px', 
                    height: '32px',
                    objectFit: 'contain'
                  }}
                  className="object-contain"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Esta é como o favicon aparecerá na aba do navegador
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tamanho recomendado: 32x32 pixels
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload */}
        <div className="space-y-3">
          <Label htmlFor="favicon-upload" className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Novo Favicon
          </Label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                id="favicon-upload"
                type="file"
                accept="image/x-icon,image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleFileSelect}
                className="cursor-pointer border-2 border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
                disabled={uploading}
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={uploading || !preview}
              className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all font-semibold px-6"
              style={{ fontWeight: 700 }}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Salvando...' : 'Salvar Favicon'}
            </Button>
          </div>
          {preview && preview !== favicon ? (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ Você tem alterações pendentes. Clique em "Salvar Favicon" para aplicar.
            </p>
          ) : null}
        </div>

        {/* Remover */}
        {favicon && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleRemove}
              variant="outline"
              disabled={uploading}
              className="rounded-xl text-red-600 dark:text-red-400 border-2 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 hover:border-red-400 dark:hover:border-red-500 transition-all font-semibold"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remover Favicon
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para seção de estilização
function StylingSection() {
  const [theme, setTheme] = useState({
    colors: {
      primary: '#0ea5e9',
      secondary: '#46d392',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#1f2937',
    },
    sizes: {
      cardWidth: '280px',
      cardHeight: 'auto',
      borderRadius: '12px',
    },
    customCSS: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        setLoading(true);
        const data = await themeAPI.get();
        setTheme(data);
      } catch (error) {
        console.error('Error loading theme:', error);
        toast.error('Erro ao carregar configurações de tema');
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, []);

  const handleColorChange = (colorKey: string, value: string) => {
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value,
      },
    }));
  };

  const handleSizeChange = (sizeKey: string, value: string) => {
    setTheme(prev => ({
      ...prev,
      sizes: {
        ...prev.sizes,
        [sizeKey]: value,
      },
    }));
  };

  const handleCustomCSSChange = (value: string) => {
    setTheme(prev => ({
      ...prev,
      customCSS: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await themeAPI.update(theme);
      toast.success('Configurações de estilização salvas com sucesso!');
    } catch (error: any) {
      console.error('Error saving theme:', error);
      toast.error(error?.response?.data?.error || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Carregando configurações de estilização...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cores */}
      <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 shadow-md">
              <Palette className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Cores do Site
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Personalize as cores principais do site
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Cor Primária</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="primary-color"
                  type="color"
                  value={theme.colors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={theme.colors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="flex-1"
                  placeholder="#0ea5e9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Cor Secundária</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="secondary-color"
                  type="color"
                  value={theme.colors.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={theme.colors.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="flex-1"
                  placeholder="#46d392"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent-color">Cor de Destaque</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="accent-color"
                  type="color"
                  value={theme.colors.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={theme.colors.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="flex-1"
                  placeholder="#f59e0b"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="background-color">Cor de Fundo</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="background-color"
                  type="color"
                  value={theme.colors.background}
                  onChange={(e) => handleColorChange('background', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={theme.colors.background}
                  onChange={(e) => handleColorChange('background', e.target.value)}
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="text-color">Cor do Texto</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="text-color"
                  type="color"
                  value={theme.colors.text}
                  onChange={(e) => handleColorChange('text', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={theme.colors.text}
                  onChange={(e) => handleColorChange('text', e.target.value)}
                  className="flex-1"
                  placeholder="#1f2937"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tamanhos */}
      <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 shadow-md">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Tamanhos e Espaçamentos
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Ajuste os tamanhos de cards e elementos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="card-width">Largura do Card</Label>
              <Input
                id="card-width"
                type="text"
                value={theme.sizes.cardWidth}
                onChange={(e) => handleSizeChange('cardWidth', e.target.value)}
                placeholder="280px"
              />
              <p className="text-xs text-gray-500">Ex: 280px, 20rem, 100%</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-height">Altura do Card</Label>
              <Input
                id="card-height"
                type="text"
                value={theme.sizes.cardHeight}
                onChange={(e) => handleSizeChange('cardHeight', e.target.value)}
                placeholder="auto"
              />
              <p className="text-xs text-gray-500">Ex: auto, 400px, 100%</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="border-radius">Raio da Borda</Label>
              <Input
                id="border-radius"
                type="text"
                value={theme.sizes.borderRadius}
                onChange={(e) => handleSizeChange('borderRadius', e.target.value)}
                placeholder="12px"
              />
              <p className="text-xs text-gray-500">Ex: 12px, 0.5rem, 50%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CSS Customizado */}
      <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 shadow-md">
              <Code className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                CSS Customizado
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Adicione efeitos especiais e estilos customizados (ex: neve no Natal)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="custom-css">Código CSS</Label>
            <Textarea
              id="custom-css"
              value={theme.customCSS}
              onChange={(e) => handleCustomCSSChange(e.target.value)}
              placeholder="/* Exemplo: Efeito de neve no Natal */
@keyframes snowfall {
  0% { transform: translateY(-100vh) rotate(0deg); }
  100% { transform: translateY(100vh) rotate(360deg); }
}

.snowflake {
  position: fixed;
  top: -10px;
  color: white;
  font-size: 1em;
  animation: snowfall 10s linear infinite;
  pointer-events: none;
}"
              className="font-mono text-sm"
              rows={15}
            />
            <p className="text-xs text-gray-500">
              O CSS será injetado diretamente na página. Use com cuidado!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all font-semibold px-8"
          style={{ fontWeight: 700 }}
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}


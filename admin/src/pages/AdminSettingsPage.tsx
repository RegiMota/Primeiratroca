import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../lib/api';
import { Settings, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

export function AdminSettingsPage() {
  const { user } = useAuth();
  const [logo, setLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        setLoading(true);
        const data = await adminAPI.getLogo();
        setLogo(data.logo);
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
        await adminAPI.updateLogo(preview);
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
      await adminAPI.updateLogo('');
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

      <div className="space-y-6">
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
                  <div className="h-20 w-auto flex items-center justify-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                    <img
                      src={preview}
                      alt="Logo preview"
                      className="max-h-14 max-w-40 object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Esta é como a logo aparecerá no cabeçalho do site
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      A logo será redimensionada automaticamente para se ajustar ao cabeçalho
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                  disabled={!preview || uploading || preview === logo}
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all font-semibold px-6"
                  style={{ fontWeight: 700 }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? 'Salvando...' : 'Salvar Logo'}
                </Button>
              </div>
              {preview && preview !== logo && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ Você tem uma nova logo selecionada. Clique em "Salvar Logo" para aplicar as alterações.
                </p>
              )}
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

        {/* Placeholder para futuras configurações */}
        <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg opacity-50">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Configurações Adicionais
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Mais opções de configuração em breve
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              Novas configurações serão adicionadas aqui em breve
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


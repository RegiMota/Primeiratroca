import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';
import { settingsAPI, updateLogo } from '../lib/api';
import { Settings, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

export function AdminSettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [logo, setLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadLogo = async () => {
      if (!isAuthenticated || !user?.isAdmin) {
        setLocation('/');
        return;
      }

      try {
        setLoading(true);
        const data = await settingsAPI.getLogo();
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
  }, [isAuthenticated, user, setLocation]);

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
          
          // Converter para base64 com qualidade reduzida para PNG/JPG
          let base64String: string;
          if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg') {
            // Usar JPEG com qualidade 0.85 para reduzir tamanho
            base64String = canvas.toDataURL('image/jpeg', 0.85);
          } else {
            // Para SVG e outros, usar o original
            base64String = reader.result as string;
          }
          
          setPreview(base64String);
        } else {
          // Fallback se canvas não funcionar
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
      await updateLogo(preview);
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
      await updateLogo('');
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

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-center">
        <p className="text-gray-600">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h2 className="mb-2 text-sky-500" style={{ fontSize: '2rem', fontWeight: 900 }}>
          Configurações do Site
        </h2>
        <p className="text-gray-600">Gerencie a identidade visual da loja</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-sky-500" />
            <CardTitle>Logo do Site</CardTitle>
          </div>
          <CardDescription>
            Faça upload da logo que aparecerá no cabeçalho do site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações sobre formato e tamanho */}
          <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-blue-900">Especificações da Logo:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li><strong>Formatos aceitos:</strong> PNG, JPG, JPEG, SVG ou WebP</li>
                  <li><strong>Tamanho recomendado:</strong> 200x60 pixels (proporção 3.3:1)</li>
                  <li><strong>Tamanho máximo:</strong> 2MB</li>
                  <li><strong>Formato ideal:</strong> PNG com fundo transparente</li>
                  <li><strong>Dimensões mínimas:</strong> 150x45 pixels</li>
                  <li><strong>Dimensões máximas:</strong> 400x120 pixels</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Preview da logo atual */}
          {preview && (
            <div className="space-y-2">
              <Label>Preview da Logo</Label>
              <div className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <div className="h-20 w-auto flex items-center justify-center">
                  <img
                    src={preview}
                    alt="Logo preview"
                    className="max-h-20 max-w-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    Esta é como a logo aparecerá no cabeçalho do site
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo-upload">Nova Logo</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                  disabled={uploading}
                />
              </div>
              <Button
                onClick={handleUpload}
                disabled={!preview || uploading || preview === logo}
                className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
                style={{ fontWeight: 700 }}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? 'Salvando...' : 'Salvar Logo'}
              </Button>
            </div>
          </div>

          {/* Remover */}
          {logo && (
            <div className="pt-4 border-t">
              <Button
                onClick={handleRemove}
                variant="outline"
                disabled={uploading}
                className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover Logo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


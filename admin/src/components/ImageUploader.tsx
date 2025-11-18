import { useState } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface ImageUploaderProps {
  onUpload: (base64: string) => void | Promise<void>;
  maxSizeMB?: number;
  maxWidth?: number;
  maxHeight?: number;
  disabled?: boolean;
}

export function ImageUploader({ onUpload, maxSizeMB = 2, maxWidth = 800, maxHeight = 300, disabled = false }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const optimizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        reject(new Error('Por favor, selecione um arquivo de imagem válido (PNG, JPG, JPEG, SVG ou WebP)'));
        return;
      }

      // Validar tamanho
      if (file.size > maxSizeMB * 1024 * 1024) {
        reject(new Error(`A imagem deve ter no máximo ${maxSizeMB}MB`));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Criar canvas para redimensionar se necessário
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar se for muito grande
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);

            let base64String: string;
            if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg') {
              // Para imagens pequenas (80x80), usar qualidade menor para reduzir tamanho
              const quality = width <= 100 && height <= 100 ? 0.7 : 0.85;
              base64String = canvas.toDataURL('image/jpeg', quality); // Compressão para JPEG
            } else if (file.type === 'image/svg+xml') {
              // Para SVG, usar o original
              base64String = reader.result as string;
            } else {
              // Para outros formatos, converter para JPEG com compressão
              const quality = width <= 100 && height <= 100 ? 0.7 : 0.85;
              base64String = canvas.toDataURL('image/jpeg', quality);
            }

            resolve(base64String);
          } else {
            reject(new Error('Erro ao processar a imagem'));
          }
        };
        img.onerror = () => {
          reject(new Error('Erro ao carregar a imagem'));
        };
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Erro ao ler o arquivo'));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (file: File) => {
    try {
      setUploading(true);
      const base64 = await optimizeImage(file);
      await onUpload(base64);
      toast.success('Imagem processada com sucesso!');
    } catch (error: any) {
      console.error('Error processing image:', error);
      toast.error(error.message || 'Erro ao processar a imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
        dragActive
          ? 'border-sky-500 bg-sky-50'
          : disabled
          ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
          : 'border-gray-300 hover:border-sky-400 cursor-pointer'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
        onChange={handleChange}
        disabled={disabled || uploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />

      <div className="flex flex-col items-center justify-center gap-2 text-center">
        {uploading ? (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            <p className="text-sm text-gray-600">Processando imagem...</p>
          </>
        ) : (
          <>
            <Upload className={`h-8 w-8 ${disabled ? 'text-gray-400' : 'text-sky-500'}`} />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Arraste uma imagem aqui ou clique para selecionar
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, JPEG, SVG, WebP até {maxSizeMB}MB
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Será redimensionada para {maxWidth}x{maxHeight}px se necessário
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


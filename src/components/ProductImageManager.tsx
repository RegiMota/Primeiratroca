import { useState, useEffect } from 'react';
import { ImageUploader } from './ImageUploader';
import { ImageGallery } from './ImageGallery';
import { productImagesAPI } from '../lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ImageIcon } from 'lucide-react';

interface ProductImage {
  id: number;
  productId: number;
  url: string;
  isPrimary: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductImageManagerProps {
  productId: number;
  disabled?: boolean;
}

export function ProductImageManager({ productId, disabled = false }: ProductImageManagerProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, [productId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const data = await productImagesAPI.getAll(productId);
      setImages(data);
    } catch (error: any) {
      console.error('Error loading images:', error);
      // Não exibir erro se for produto novo (ainda não criado)
      if (productId > 0) {
        toast.error('Erro ao carregar imagens');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (base64: string) => {
    try {
      const image = await productImagesAPI.upload(productId, base64);
      setImages([...images, image]);
      toast.success('Imagem adicionada com sucesso!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.error || 'Erro ao fazer upload da imagem');
      throw error;
    }
  };

  const handleDelete = async (imageId: number) => {
    try {
      await productImagesAPI.delete(productId, imageId);
      setImages(images.filter((img) => img.id !== imageId));
      toast.success('Imagem deletada com sucesso!');
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast.error(error.response?.data?.error || 'Erro ao deletar imagem');
      throw error;
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    try {
      await productImagesAPI.update(productId, imageId, { isPrimary: true });
      // Atualizar localmente
      setImages(
        images.map((img) => ({
          ...img,
          isPrimary: img.id === imageId,
        }))
      );
      toast.success('Imagem principal atualizada!');
    } catch (error: any) {
      console.error('Error setting primary image:', error);
      toast.error(error.response?.data?.error || 'Erro ao atualizar imagem principal');
      throw error;
    }
  };

  const handleReorder = async (imageId: number, direction: 'up' | 'down') => {
    try {
      const image = images.find((img) => img.id === imageId);
      if (!image) return;

      const currentIndex = images.findIndex((img) => img.id === imageId);
      const newOrder = direction === 'up' ? image.order - 1 : image.order + 1;

      // Trocar com a imagem adjacente
      const targetImage = images.find((img) => img.order === newOrder);
      if (!targetImage) return;

      // Atualizar ordens
      await Promise.all([
        productImagesAPI.update(productId, imageId, { order: newOrder }),
        productImagesAPI.update(productId, targetImage.id, { order: image.order }),
      ]);

      // Atualizar localmente
      const newImages = [...images];
      const imageToMove = newImages[currentIndex];
      const targetIndex = newImages.findIndex((img) => img.id === targetImage.id);

      newImages[currentIndex] = { ...targetImage, order: image.order };
      newImages[targetIndex] = { ...imageToMove, order: newOrder };

      setImages(newImages.sort((a, b) => a.order - b.order));
    } catch (error: any) {
      console.error('Error reordering image:', error);
      toast.error(error.response?.data?.error || 'Erro ao reordenar imagem');
      throw error;
    }
  };

  if (productId <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" /> Imagens do Produto
          </CardTitle>
          <CardDescription>
            Salve o produto primeiro para adicionar imagens
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" /> Imagens do Produto
        </CardTitle>
        <CardDescription>
          Adicione múltiplas imagens para este produto. A primeira imagem será a principal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Uploader */}
        {!disabled && (
          <ImageUploader
            onUpload={handleUpload}
            maxSizeMB={2}
            maxWidth={800}
            maxHeight={300}
            disabled={disabled || loading}
          />
        )}

        {/* Gallery */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
            <p className="mt-2">Carregando imagens...</p>
          </div>
        ) : (
          <ImageGallery
            images={images}
            productId={productId}
            onDelete={handleDelete}
            onSetPrimary={handleSetPrimary}
            onReorder={handleReorder}
            deletable={!disabled}
            reorderable={!disabled}
          />
        )}
      </CardContent>
    </Card>
  );
}


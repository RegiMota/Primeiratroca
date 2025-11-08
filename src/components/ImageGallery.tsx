import { useState } from 'react';
import { Trash2, Star, StarOff, ArrowUp, ArrowDown, X } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface ProductImage {
  id: number;
  productId: number;
  url: string;
  isPrimary: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface ImageGalleryProps {
  images: ProductImage[];
  productId: number;
  onDelete: (imageId: number) => void | Promise<void>;
  onSetPrimary: (imageId: number) => void | Promise<void>;
  onReorder: (imageId: number, direction: 'up' | 'down') => void | Promise<void>;
  onImageClick?: (image: ProductImage) => void;
  deletable?: boolean;
  reorderable?: boolean;
}

export function ImageGallery({
  images,
  productId,
  onDelete,
  onSetPrimary,
  onReorder,
  onImageClick,
  deletable = true,
  reorderable = true,
}: ImageGalleryProps) {
  const [deleting, setDeleting] = useState<number | null>(null);
  const [primarying, setPrimarying] = useState<number | null>(null);
  const [reordering, setReordering] = useState<number | null>(null);

  const handleDelete = async (imageId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja deletar esta imagem?')) return;

    try {
      setDeleting(imageId);
      await onDelete(imageId);
      toast.success('Imagem deletada com sucesso!');
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast.error(error.message || 'Erro ao deletar imagem');
    } finally {
      setDeleting(null);
    }
  };

  const handleSetPrimary = async (imageId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setPrimarying(imageId);
      await onSetPrimary(imageId);
      toast.success('Imagem principal atualizada!');
    } catch (error: any) {
      console.error('Error setting primary image:', error);
      toast.error(error.message || 'Erro ao atualizar imagem principal');
    } finally {
      setPrimarying(null);
    }
  };

  const handleReorder = async (imageId: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setReordering(imageId);
      await onReorder(imageId, direction);
    } catch (error: any) {
      console.error('Error reordering image:', error);
      toast.error(error.message || 'Erro ao reordenar imagem');
    } finally {
      setReordering(null);
    }
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhuma imagem adicionada ainda</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image, index) => (
        <div
          key={image.id}
          className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
            image.isPrimary ? 'border-amber-400 ring-2 ring-amber-200' : 'border-gray-200'
          } ${onImageClick ? 'cursor-pointer hover:border-sky-400' : ''}`}
          onClick={() => onImageClick?.(image)}
        >
          {/* Imagem */}
          <div className="aspect-square bg-gray-100 relative">
            <img
              src={image.url}
              alt={`Imagem ${index + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Badge de imagem primária */}
            {image.isPrimary && (
              <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                <Star className="h-3 w-3" />
                Principal
              </div>
            )}

            {/* Overlay com ações */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              {deletable && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => handleDelete(image.id, e)}
                  disabled={deleting === image.id}
                  className="h-8 w-8 p-0"
                >
                  {deleting === image.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}

              {!image.isPrimary && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={(e) => handleSetPrimary(image.id, e)}
                  disabled={primarying === image.id}
                  className="h-8 bg-amber-500 hover:bg-amber-600"
                >
                  {primarying === image.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
              )}

              {reorderable && index > 0 && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={(e) => handleReorder(image.id, 'up', e)}
                  disabled={reordering === image.id}
                  className="h-8 w-8 p-0 bg-sky-500 hover:bg-sky-600"
                >
                  {reordering === image.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </Button>
              )}

              {reorderable && index < images.length - 1 && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={(e) => handleReorder(image.id, 'down', e)}
                  disabled={reordering === image.id}
                  className="h-8 w-8 p-0 bg-sky-500 hover:bg-sky-600"
                >
                  {reordering === image.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Informações */}
          <div className="p-2 bg-white">
            <p className="text-xs text-gray-600">
              Ordem: {image.order} {image.isPrimary && '• Principal'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}


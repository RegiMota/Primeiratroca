// ImageService - Upload de Imagens com Cloudinary
// Suporta Cloudinary e fallback para base64 (desenvolvimento)

import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

// Configurar Cloudinary (se credenciais estiverem disponíveis)
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export interface UploadOptions {
  folder?: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpg' | 'jpeg' | 'png' | 'webp';
}

export class ImageService {
  /**
   * Faz upload de imagem para Cloudinary
   * Se Cloudinary não estiver configurado, retorna base64 como fallback
   */
  static async uploadImage(
    imageBase64: string,
    options: UploadOptions = {}
  ): Promise<string> {
    try {
      // Se Cloudinary não estiver configurado, usar base64
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.log('⚠️ Cloudinary não configurado. Usando base64 como fallback.');
        return imageBase64;
      }

      // Processar imagem com Sharp (redimensionar e otimizar)
      const imageBuffer = Buffer.from(imageBase64.split(',')[1] || imageBase64, 'base64');
      
      let processedBuffer = imageBuffer;
      
      // Redimensionar se especificado
      if (options.width || options.height) {
        processedBuffer = await sharp(imageBuffer)
          .resize(options.width, options.height, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .toFormat(options.format || 'webp', {
            quality: options.quality || 85,
          })
          .toBuffer();
      } else {
        // Apenas otimizar (sem redimensionar)
        processedBuffer = await sharp(imageBuffer)
          .toFormat(options.format || 'webp', {
            quality: options.quality || 85,
          })
          .toBuffer();
      }

      // Upload para Cloudinary
      const folder = options.folder || 'primeira-troca/products';
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            transformation: [
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as { secure_url: string });
          }
        );

        uploadStream.end(processedBuffer);
      });

      console.log('✅ Imagem enviada para Cloudinary:', result.secure_url);
      return result.secure_url;
    } catch (error) {
      console.error('❌ Erro ao fazer upload para Cloudinary:', error);
      // Fallback para base64 em caso de erro
      console.log('⚠️ Usando base64 como fallback.');
      return imageBase64;
    }
  }

  /**
   * Deleta imagem do Cloudinary
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Se não for URL do Cloudinary, não fazer nada (pode ser base64 ou URL externa)
      if (!imageUrl.includes('cloudinary.com')) {
        return;
      }

      // Se Cloudinary não estiver configurado, não fazer nada
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        return;
      }

      // Extrair public_id da URL
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicId = filename.split('.')[0];
      const folder = urlParts[urlParts.length - 2];

      const fullPublicId = folder ? `${folder}/${publicId}` : publicId;

      await cloudinary.uploader.destroy(fullPublicId);
      console.log('✅ Imagem deletada do Cloudinary:', fullPublicId);
    } catch (error) {
      console.error('❌ Erro ao deletar imagem do Cloudinary:', error);
      // Não lançar erro - não deve bloquear outras operações
    }
  }

  /**
   * Verifica se Cloudinary está configurado
   */
  static isCloudinaryConfigured(): boolean {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }
}


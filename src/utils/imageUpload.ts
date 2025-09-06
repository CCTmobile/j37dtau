import { supabase } from './supabase/client';

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  generateSizes?: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ProcessedImage {
  original: File;
  optimized: Blob;
  thumbnail?: Blob;
  format: string;
  originalSize: number;
  optimizedSize: number;
  dimensions: { width: number; height: number };
}

export class ImageUploadService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  private static readonly BUCKET_NAME = 'product-images';

  /**
   * Validate file before processing
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, WebP, and AVIF are allowed.'
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'File size too large. Maximum size is 10MB.'
      };
    }

    return { valid: true };
  }

  /**
   * Convert image to canvas for processing
   */
  private static async fileToCanvas(file: File): Promise<{
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      img.onload = () => {
        // Calculate dimensions maintaining aspect ratio
        const maxWidth = 1920;
        const maxHeight = 1920;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        resolve({ canvas, ctx, width, height });
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Convert canvas to blob with specified format
   */
  private static async canvasToBlob(
    canvas: HTMLCanvasElement,
    format: string,
    quality: number = 0.85
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        format,
        quality
      );
    });
  }

  /**
   * Process and optimize image
   */
  static async processImage(
    file: File,
    options: ImageUploadOptions = {}
  ): Promise<ProcessedImage> {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.85,
      format = 'webp',
      generateSizes = true
    } = options;

    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const { canvas, ctx, width, height } = await this.fileToCanvas(file);

    // Resize if needed
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      const newWidth = width * ratio;
      const newHeight = height * ratio;

      const resizedCanvas = document.createElement('canvas');
      const resizedCtx = resizedCanvas.getContext('2d')!;

      resizedCanvas.width = newWidth;
      resizedCanvas.height = newHeight;
      resizedCtx.drawImage(canvas, 0, 0, newWidth, newHeight);

      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.drawImage(resizedCanvas, 0, 0);
    }

    // Convert to optimized format
    const mimeType = `image/${format}`;
    const optimizedBlob = await this.canvasToBlob(canvas, mimeType, quality);

    // Generate thumbnail if requested
    let thumbnail: Blob | undefined;
    if (generateSizes) {
      const thumbCanvas = document.createElement('canvas');
      const thumbCtx = thumbCanvas.getContext('2d')!;

      const thumbSize = 300;
      const thumbRatio = Math.min(thumbSize / width, thumbSize / height);
      thumbCanvas.width = width * thumbRatio;
      thumbCanvas.height = height * thumbRatio;

      thumbCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
      thumbnail = await this.canvasToBlob(thumbCanvas, mimeType, quality);
    }

    return {
      original: file,
      optimized: optimizedBlob,
      thumbnail,
      format,
      originalSize: file.size,
      optimizedSize: optimizedBlob.size,
      dimensions: { width: canvas.width, height: canvas.height }
    };
  }

  /**
   * Upload processed image to Supabase Storage
   */
  static async uploadToStorage(
    processedImage: ProcessedImage,
    productId: string,
    _onProgress?: (progress: UploadProgress) => void
  ): Promise<{ url: string; thumbnailUrl?: string }> {
    const timestamp = Date.now();
    const fileName = `${productId}/${timestamp}.${processedImage.format}`;

    // Upload main image
    const { data: _mainData, error: mainError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, processedImage.optimized, {
        contentType: `image/${processedImage.format}`,
        upsert: false
      });

    if (mainError) {
      throw new Error(`Upload failed: ${mainError.message}`);
    }

    // Get public URL for main image
    const { data: mainUrl } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(fileName);

    let thumbnailUrl: string | undefined;

    // Upload thumbnail if available
    if (processedImage.thumbnail) {
      const thumbFileName = `${productId}/${timestamp}_thumb.${processedImage.format}`;

      const { data: _thumbData, error: thumbError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(thumbFileName, processedImage.thumbnail, {
          contentType: `image/${processedImage.format}`,
          upsert: false
        });

      if (!thumbError) {
        const { data: thumbUrlData } = supabase.storage
          .from(this.BUCKET_NAME)
          .getPublicUrl(thumbFileName);
        thumbnailUrl = thumbUrlData.publicUrl;
      }
    }

    return {
      url: mainUrl.publicUrl,
      thumbnailUrl
    };
  }

  /**
   * Upload multiple images with progress tracking
   */
  static async uploadMultipleImages(
    files: File[],
    productId: string,
    options: ImageUploadOptions = {},
    _onProgress?: (fileIndex: number, progress: UploadProgress) => void,
    onFileComplete?: (fileIndex: number, result: { url: string; thumbnailUrl?: string }) => void
  ): Promise<Array<{ url: string; thumbnailUrl?: string; fileName: string }>> {
    const results: Array<{ url: string; thumbnailUrl?: string; fileName: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Process image
        const processedImage = await this.processImage(file, options);

        // Upload to storage
        const uploadResult = await this.uploadToStorage(processedImage, productId);

        const result = {
          url: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl,
          fileName: file.name
        };

        results.push(result);
        onFileComplete?.(i, result);

      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        // Continue with other files
      }
    }

    return results;
  }

  /**
   * Delete image from storage
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const productId = urlParts[urlParts.length - 2];

    if (!fileName || !productId) {
      throw new Error('Invalid image URL format');
    }

    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([`${productId}/${fileName}`]);

    if (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Check if storage bucket exists and is accessible
   */
  static async checkBucketExists(): Promise<boolean> {
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error('Error listing buckets:', listError);
        // If we can't list buckets, try to access the specific bucket directly
        return await this.checkBucketDirectly();
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);
      return bucketExists;
    } catch (error) {
      console.error('Error checking bucket existence:', error);
      return false;
    }
  }

  /**
   * Check bucket by trying to access it directly (fallback method)
   */
  static async checkBucketDirectly(): Promise<boolean> {
    try {
      // Try to list objects in the bucket (this will fail if bucket doesn't exist)
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list('', { limit: 1 });

      // If no error, bucket exists and is accessible
      return !error;
    } catch (error) {
      console.error('Error checking bucket directly:', error);
      return false;
    }
  }
}

export default ImageUploadService;

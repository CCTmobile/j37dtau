// Qwen AI Image Editing API Integration
// Official Alibaba Qwen API for image editing

import { supabase } from './supabase/client';

export interface QwenEditRequest {
  image: Blob;
  edit_type: string;
  reference_image?: Blob;
  api_key?: string;
  api_endpoint?: string;
  options?: {
    color?: string;
    shape?: string;
    scenario?: string;
  };
}

export interface QwenEditResponse {
  success: boolean;
  edited_image?: Blob;
  error?: string;
  queued?: boolean;
  requestId?: string;
  networkStatus?: 'online' | 'offline';
  imageUrl?: string; // URL of saved image
  imageId?: string; // Unique ID for the processed image
  storedRun?: StoredAiRun;
}

export interface StoredAiRun {
  runId: string;
  storagePath: string;
  thumbnailPath: string;
  publicUrl: string;
  thumbnailUrl: string;
  mimeType: string;
}

export interface StoredImage {
  id: string;
  originalImageId: string;
  editType: string;
  blob: Blob;
  url: string;
  timestamp: number;
  metadata?: any;
}

export class QwenImageEditor {
  private imageStorageDB: IDBDatabase | null = null;

  constructor(apiKey?: string, apiEndpoint?: string) {
    // API key and endpoint not needed when using Supabase function
    this.initImageStorage();
  }

  private async initImageStorage() {
    // Initialize IndexedDB for local image storage
    const request = indexedDB.open('QwenImageStorage', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('processedImages')) {
        const store = db.createObjectStore('processedImages', { keyPath: 'id' });
        store.createIndex('originalImageId', 'originalImageId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      this.imageStorageDB = (event.target as IDBOpenDBRequest).result;
      console.log('🗄️ Image storage database initialized');
    };

    request.onerror = (error) => {
      console.error('❌ Failed to initialize image storage:', error);
    };
  }

  private generateImageId(blob: Blob): string {
    // Generate a simple ID based on blob size and timestamp
    // In a production app, you might want to use a proper hash
    return `orig_${blob.size}_${Date.now()}`;
  }

  private async saveImageLocally(imageId: string, originalImageId: string, editType: string, blob: Blob, metadata?: any): Promise<string> {
    if (!this.imageStorageDB) {
      throw new Error('Image storage not initialized');
    }

    const url = URL.createObjectURL(blob);
    const storedImage: StoredImage = {
      id: imageId,
      originalImageId,
      editType,
      blob,
      url,
      timestamp: Date.now(),
      metadata
    };

    const transaction = this.imageStorageDB.transaction(['processedImages'], 'readwrite');
    const store = transaction.objectStore('processedImages');
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(storedImage);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log(`💾 Image saved locally: ${imageId}`);
    return url;
  }

  private async saveImageToSupabase(blob: Blob, imageId: string): Promise<string> {
    const fileName = `ai-processed/${imageId}.png`;
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error('❌ Failed to save image to Supabase:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    console.log(`☁️ Image saved to Supabase: ${publicUrl}`);
    return publicUrl;
  }

  async loadStoredImage(imageId: string): Promise<StoredImage | null> {
    if (!this.imageStorageDB) {
      return null;
    }

    const transaction = this.imageStorageDB.transaction(['processedImages'], 'readonly');
    const store = transaction.objectStore('processedImages');
    
    return new Promise((resolve) => {
      const request = store.get(imageId);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Recreate blob URL if needed
          if (!result.url || !result.url.startsWith('blob:')) {
            result.url = URL.createObjectURL(result.blob);
          }
        }
        resolve(result || null);
      };
      request.onerror = () => resolve(null);
    });
  }

  async getStoredImagesForOriginal(originalImageId: string): Promise<StoredImage[]> {
    if (!this.imageStorageDB) {
      return [];
    }

    const transaction = this.imageStorageDB.transaction(['processedImages'], 'readonly');
    const store = transaction.objectStore('processedImages');
    const index = store.index('originalImageId');
    
    return new Promise((resolve) => {
      const request = index.getAll(originalImageId);
      request.onsuccess = () => {
        const results = request.result || [];
        // Ensure blob URLs are valid
        results.forEach(result => {
          if (!result.url || !result.url.startsWith('blob:')) {
            result.url = URL.createObjectURL(result.blob);
          }
        });
        resolve(results);
      };
      request.onerror = () => resolve([]);
    });
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private getPromptForEditType(editType: string, options?: { color?: string; shape?: string; scenario?: string }): string {
    const { color = 'natural', shape = 'original', scenario = 'general' } = options || {};

switch (editType) {
      case 'remove_bg':
        return 'Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Isolate only the main subject with a completely transparent background. Apply HDR enhancement: improve dynamic range, recover shadow/highlight details, and boost clarity. Output must be a PNG with pure transparency and no background remnants.';

      case 'replace_bg_white':
        return `Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Extract the main subject and place it on a pure white background (#FFFFFF)—no textures, gradients, or noise. Apply HDR enhancement: improve contrast, recover details, and ensure professional color fidelity. Maintain original lighting and proportions.`;

      case 'replace_bg_black':
        return `Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Extract the main subject and place it on a pure black background (#000000)—no textures, gradients, or noise. Apply HDR enhancement: enhance tonal range, sharpen details, and preserve natural lighting. Keep subject colors accurate and vivid.`;

      case 'replace_bg_transparent':
        return 'Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Isolate only the main subject with a completely transparent background. Apply HDR enhancement: improve dynamic range, recover shadow/highlight details, and boost clarity. Output must be a PNG with pure transparency and no background remnants.';

      case 'replace_bg_gradient':
        return `Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Place the main subject on a smooth, professional gradient background using complementary colors that enhance the subject. Apply HDR enhancement: enrich contrast, recover details in all tonal ranges, and ensure the subject remains crisp and naturally lit.`;

      case 'replace_bg_nature':
        return `Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Seamlessly integrate the main subject into a realistic, high-fidelity natural outdoor environment (${scenario}) that complements its form, color, and context. Apply professional HDR enhancement: balance lighting between subject and background, recover ambient details in foliage/sky/terrain, and ensure cohesive depth, atmosphere, and natural shadow integration. The result should look like a professionally photographed scene—not a composite.`;

      case 'replace_bg_studio':
        return `Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Place the main subject in a professional photography studio setting with soft, directional lighting and a seamless backdrop. Apply HDR enhancement: maximize detail, ensure perfect exposure, and produce a high-end commercial product photo with rich tonal depth.`;

      case 'enhance_quality':
        return 'Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Apply comprehensive HDR enhancement: significantly improve sharpness, dynamic range, color balance, contrast, and micro-detail recovery. Produce a polished, professional-grade image while preserving original composition and intent.';

      case 'enhance_colors':
        return `Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Enhance colors with increased saturation, improved contrast, and refined tonal harmony in a (${color} style). Apply HDR processing to recover highlight/shadow details and ensure vibrant yet natural-looking results. Maintain original composition.`;

      case 'enhance_sharpness':
        return 'Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Apply aggressive yet natural-looking sharpening with HDR detail recovery: enhance edges, reduce blur, amplify texture clarity, and restore fine details without introducing halos or noise.';

      case 'enhance_hdr':
        return 'Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Apply advanced HDR processing: dramatically expand dynamic range, reveal hidden details in shadows and highlights, balance local contrast, and produce a rich, cinematic, professional-quality image with depth and realism.';

      case 'effect_vintage':
        return 'Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Apply a vintage film effect with subtle color shifts, authentic film grain, and soft contrast—but first apply HDR enhancement to preserve detail and clarity beneath the nostalgic aesthetic.';

      case 'effect_bw':
        return 'Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Convert to professional black and white with HDR tonal range: rich blacks, clean whites, nuanced midtones, and enhanced texture detail. Apply artistic contrast for a timeless monochrome photograph.';

      case 'effect_sepia':
        return 'Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Apply a warm sepia tone with HDR-enhanced detail: preserve texture and depth in shadows/highlights while giving a nostalgic, historical photograph appearance with balanced warmth and clarity.';

      case 'effect_cartoon':
        return 'Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Transform into a stylized cartoon: simplify shapes, bold outlines, vibrant HDR-enhanced colors, and smooth gradients—while retaining recognizable subject features and expressive clarity.';

      case 'transform_square':
        return 'Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Recompose the main subject into a perfect square format with balanced framing. Apply HDR enhancement to ensure detail, contrast, and color quality remain high after cropping or repositioning.';

      case 'transform_portrait':
        return 'Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Recompose into a vertical portrait orientation with professional framing. Apply HDR enhancement to maintain detail, lighting consistency, and visual impact in the new aspect ratio.';

      case 'transform_landscape':
        return 'Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Recompose into a horizontal landscape orientation with balanced composition. Apply HDR enhancement to preserve dynamic range, sharpness, and color fidelity across the wider frame.';

      case 'transform_circle':
        return 'Clean the image by removing any UI elements, text, or artifacts (common in screenshots). Crop the main subject into a perfect circle with centered, balanced framing. Apply HDR enhancement to retain detail and contrast within the circular bounds. Output should have a transparent or neutral background as appropriate.';

      default:
        return 'Edit this image appropriately and return the result.';
    }
  }

  private async urlToBlob(url: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Attempt to load cross-origin
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/png');
      };
      img.onerror = () => {
        reject(new Error(`Failed to load image from URL: ${url}`));
      };
      img.src = url;
    });
  }

  async editImage(request: QwenEditRequest): Promise<QwenEditResponse> {
    try {
      // Convert image to base64
      const imageBase64 = await this.blobToBase64(request.image);
      const imageDataUrl = imageBase64.split(',')[1]; // Remove data URL prefix

      // Get the prompt
      const prompt = this.getPromptForEditType(request.edit_type, request.options);

      // Add reference image if provided
      let referenceImageBase64 = null;
      if (request.reference_image) {
        const refBase64 = await this.blobToBase64(request.reference_image);
        referenceImageBase64 = refBase64.split(',')[1]; // Remove data URL prefix
      }

      // Set up promise to wait for service worker response or direct response
      let resolveResponse: (response: QwenEditResponse) => void;
      let rejectResponse: (error: Error) => void;
      const responsePromise = new Promise<QwenEditResponse>((resolve, reject) => {
        resolveResponse = resolve;
        rejectResponse = reject;
      });

      // Listen for service worker messages
      const messageHandler = async (event: MessageEvent) => {
        const { type, ...data } = event.data;
        
        if (type === 'AI_REQUEST_SUCCESS' && data.imageBlob) {
          console.log('✅ AI request completed via service worker');
          navigator.serviceWorker.removeEventListener('message', messageHandler);
          
          // Save the processed image locally and to Supabase
          const imageId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const originalImageId = this.generateImageId(request.image);
          
          try {
            // Save locally for immediate access and offline recovery
            const localUrl = await this.saveImageLocally(imageId, originalImageId, request.edit_type, data.imageBlob);
            
            // Save to Supabase for persistent storage and sharing
            const supabaseUrl = await this.saveImageToSupabase(data.imageBlob, imageId);
            
            console.log('✅ Image processed via service worker and saved successfully');
            
            resolveResponse({
              success: true,
              edited_image: data.imageBlob,
              imageUrl: supabaseUrl,
              imageId: imageId
            });
          } catch (saveError) {
            console.error('⚠️ Image processing via service worker succeeded but saving failed:', saveError);
            // Still return success since the image was processed, but log the save error
            resolveResponse({
              success: true,
              edited_image: data.imageBlob,
              error: `Image processed but saving failed: ${saveError instanceof Error ? saveError.message : 'Unknown save error'}`
            });
          }
        } else if (type === 'AI_REQUEST_FAILED' && data.maxRetriesExceeded) {
          console.log('❌ AI request failed permanently via service worker:', data.error);
          navigator.serviceWorker.removeEventListener('message', messageHandler);
          rejectResponse(new Error(data.error || 'AI processing failed after retries'));
        }
      };

      navigator.serviceWorker.addEventListener('message', messageHandler);

      // Set timeout for the operation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          navigator.serviceWorker.removeEventListener('message', messageHandler);
          reject(new Error('AI processing timeout - request may still be queued'));
        }, 300000); // 5 minutes timeout
      });

      try {
        // Call Supabase Edge Function (expects JSON response)
        const { data: supabaseData, error: supabaseError } = await supabase.functions.invoke('qwen-proxy', {
          body: {
            imageBase64: imageDataUrl,
            prompt: prompt,
            editType: request.edit_type,
            ...(referenceImageBase64 && { referenceImageBase64 })
          }
        });

        if (supabaseError) {
          throw new Error(supabaseError.message || 'Supabase function error');
        }

        if (!supabaseData) {
          throw new Error('No response from Edge Function');
        }

        // Handle JSON response from Edge Function
        const result = supabaseData;

        console.log('Supabase function response:', result); // Debug log

        if (result.error) {
          throw new Error(result.error);
        }

        // Extract generated image from response
        let imageData: string | null = null;
        let generatedImageUrl: string | null = null;
        let storedRun: StoredAiRun | null = null;

        if (result.output && result.output.results && result.output.results[0]) {
          const resultItem = result.output.results[0];
          console.log('Result item:', resultItem);

          if (resultItem.runId) {
            storedRun = {
              runId: resultItem.runId,
              storagePath: resultItem.storagePath,
              thumbnailPath: resultItem.thumbnailPath,
              publicUrl: resultItem.publicUrl,
              thumbnailUrl: resultItem.thumbnailUrl,
              mimeType: resultItem.mimeType || 'image/webp'
            };
            generatedImageUrl = storedRun.publicUrl;
            console.log('Received stored AI run metadata from Edge Function');
          } else if (resultItem.imageData) {
            // Base64 data URL returned by Edge Function (preferred fallback)
            imageData = resultItem.imageData;
            console.log('Received base64 image data from Edge Function');
          } else if (resultItem.url) {
            // Fallback to URL (older format)
            generatedImageUrl = resultItem.url;
          } else if (typeof resultItem === 'string' && resultItem.startsWith('http')) {
            generatedImageUrl = resultItem;
          } else if (typeof resultItem === 'string') {
            console.log('API returned text description instead of image:', resultItem);
            throw new Error(`API returned text description: ${resultItem.substring(0, 200)}...`);
          } else {
            console.log('Unexpected result format:', JSON.stringify(resultItem, null, 2));
            throw new Error(`Unexpected API response format: ${JSON.stringify(resultItem)}`);
          }
        }

        if (!storedRun && !imageData && !generatedImageUrl) {
          console.log('Full API response for debugging:', JSON.stringify(result, null, 2));
          throw new Error('No image data or URL found in API response.');
        }

        // Clean up message listener since we got a direct response
        navigator.serviceWorker.removeEventListener('message', messageHandler);

        if (storedRun) {
          return {
            success: true,
            storedRun,
            imageUrl: storedRun.publicUrl,
            imageId: storedRun.runId
          };
        }

        let blob: Blob;
        let resultingUrl: string | undefined;

        if (imageData) {
          // Convert base64 data URL to blob (no CORS issues)
          const base64Data = imageData.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blob = new Blob([bytes], { type: 'image/png' });
          resultingUrl = undefined;
          console.log('Converted base64 to blob successfully');
        } else {
          // Fallback: Use canvas method to load URL (CORS bypass if possible)
          console.log('Loading image from URL via canvas (fallback):', generatedImageUrl);
          blob = await this.urlToBlob(generatedImageUrl!);
          resultingUrl = generatedImageUrl ?? undefined;
        }

        // Generate unique image ID and save the processed image locally and to Supabase storage
        const imageId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const originalImageId = this.generateImageId(request.image);

        try {
          // Save locally for immediate access and offline recovery
          await this.saveImageLocally(imageId, originalImageId, request.edit_type, blob);

          // Save to Supabase for persistent storage and sharing
          const supabaseUrl = await this.saveImageToSupabase(blob, imageId);

          console.log('✅ Image processed and saved successfully');

          return {
            success: true,
            edited_image: blob,
            imageUrl: supabaseUrl,
            imageId: imageId
          };
        } catch (saveError) {
          console.error('⚠️ Image processing succeeded but saving failed:', saveError);
          // Still return success since the image was processed, but log the save error
          return {
            success: true,
            edited_image: blob,
            imageUrl: resultingUrl,
            error: `Image processed but saving failed: ${saveError instanceof Error ? saveError.message : 'Unknown save error'}`
          };
        }

      } catch (fetchError) {
        // Network error occurred - check if request was queued by service worker
        console.log('Network error occurred, checking if request was queued...');
        
        // Wait a short time for service worker to process the queue
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Check network status
        const isOnline = navigator.onLine;
        
        if (!isOnline) {
          console.log('Offline detected, request queued for later retry');
          navigator.serviceWorker.removeEventListener('message', messageHandler);
          return {
            success: false,
            error: 'Request queued for retry when online',
            queued: true,
            networkStatus: 'offline'
          };
        }
        
        // If online but still failed, wait for service worker retry or timeout
        console.log('Online but request failed - waiting for service worker retry...');
        
        try {
          // Race between service worker response and timeout
          const result = await Promise.race([responsePromise, timeoutPromise]);
          return result;
        } catch (timeoutError) {
          console.log('Request timed out, likely queued for retry');
          navigator.serviceWorker.removeEventListener('message', messageHandler);
          return {
            success: false,
            error: 'Request queued for retry',
            queued: true,
            networkStatus: 'online'
          };
        }
      }

    } catch (error) {
      console.error('Qwen API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Factory function to create Qwen editor instance
export function createQwenEditor(apiKey?: string, apiEndpoint?: string): QwenImageEditor {
  return new QwenImageEditor(apiKey, apiEndpoint);
}

// Default export for convenience
export default QwenImageEditor;
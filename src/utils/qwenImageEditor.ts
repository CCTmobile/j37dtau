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
}

export class QwenImageEditor {
  constructor(apiKey?: string, apiEndpoint?: string) {
    // API key and endpoint not needed when using Supabase function
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
        return 'Generate an image of the main subject from the provided image with a completely transparent background. Isolate only the foreground subject and remove all background elements completely. The result should be a PNG with transparent background.';

      case 'replace_bg_white':
        return `Take the main subject from the provided image and place it on a clean white background. The white background should be pure white (#FFFFFF) with no textures or patterns. Maintain the subject's original colors and lighting.`;

      case 'replace_bg_black':
        return `Take the main subject from the provided image and place it on a clean black background. The black background should be pure black (#000000) with no textures or patterns. Maintain the subject's original colors and lighting.`;

      case 'replace_bg_transparent':
        return 'Generate an image of the main subject from the provided image with a completely transparent background. Isolate only the foreground subject and remove all background elements completely. The result should be a PNG with transparent background.';

      case 'replace_bg_gradient':
        return `Take the main subject from the provided image and place it on a beautiful gradient background. Choose complementary colors that enhance the subject. The gradient should be smooth and professional-looking.`;

      case 'replace_bg_nature':
        return `Take the main subject from the provided image and place it in a beautiful natural outdoor setting. Choose an appropriate natural environment (${scenario}) that complements the subject. Include realistic lighting and atmosphere.`;

      case 'replace_bg_studio':
        return `Take the main subject from the provided image and place it in a professional photography studio setting. Include appropriate lighting, backdrop, and professional photography equipment. Make it look like a high-end product photograph.`;

      case 'enhance_quality':
        return 'Take the provided image and create an enhanced, professional version with improved sharpness, better color balance, higher contrast, and overall better visual quality. Make it look polished and high-end while maintaining the original composition.';

      case 'enhance_colors':
        return `Take the provided image and create a more vibrant, colorful version with enhanced saturation, better contrast, and more appealing color tones (${color} style) while maintaining the original composition and style.`;

      case 'enhance_sharpness':
        return 'Take the provided image and significantly increase its sharpness and clarity. Enhance details, reduce blur, and make edges crisp while maintaining natural look. Apply professional sharpening techniques.';

      case 'enhance_hdr':
        return 'Take the provided image and apply a high dynamic range (HDR) effect. Enhance contrast, bring out details in shadows and highlights, and create a more dramatic, professional look with rich tonal range.';

      case 'effect_vintage':
        return 'Take the provided image and apply a vintage film photography effect. Add film grain, slight color shifts, and the nostalgic look of old photographic film while maintaining the image clarity.';

      case 'effect_bw':
        return 'Convert the provided image to classic black and white photography. Apply professional black and white conversion with rich tonal range, proper contrast, and artistic monochrome aesthetic.';

      case 'effect_sepia':
        return 'Apply a warm sepia tone effect to the provided image. Use classic sepia brown tones that give the image a vintage, historical photograph appearance with warm, nostalgic coloring.';

      case 'effect_cartoon':
        return 'Transform the provided image into a cartoon or animated style. Simplify shapes, enhance colors, add bold outlines, and create a fun, illustrative cartoon appearance while maintaining the original subject.';

      case 'transform_square':
        return 'Take the main subject from the provided image and compose it into a perfect square format. Crop or reposition elements as needed to create a balanced square composition while maintaining the subject\'s importance.';

      case 'transform_portrait':
        return 'Take the main subject from the provided image and compose it into a vertical portrait orientation. Adjust composition and cropping to create a professional portrait-style image with appropriate vertical framing.';

      case 'transform_landscape':
        return 'Take the main subject from the provided image and compose it into a horizontal landscape orientation. Adjust composition and cropping to create a professional landscape-style image with appropriate horizontal framing.';

      case 'transform_circle':
        return 'Take the main subject from the provided image and compose it into a circular format. Crop the image into a perfect circle, ensuring the subject is well-centered and properly framed within the circular composition.';

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
      let imageData = null;
      let generatedImageUrl = null;  // Declare generatedImageUrl here

      if (result.output && result.output.results && result.output.results[0]) {
        const resultItem = result.output.results[0];
        console.log('Result item:', resultItem);

        if (resultItem.imageData) {
          // Base64 data URL returned by Edge Function (preferred)
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

      if (!imageData && !generatedImageUrl) {
        console.log('Full API response for debugging:', JSON.stringify(result, null, 2));
        throw new Error('No image data or URL found in API response.');
      }

      let blob;
      if (imageData) {
        // Convert base64 data URL to blob (no CORS issues)
        const base64Data = imageData.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: 'image/png' });
        console.log('Converted base64 to blob successfully');
      } else {
        // Fallback: Use canvas method to load URL (CORS bypass if possible)
        console.log('Loading image from URL via canvas (fallback):', generatedImageUrl);
        blob = await this.urlToBlob(generatedImageUrl);
      }

      return {
        success: true,
        edited_image: blob
      };

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
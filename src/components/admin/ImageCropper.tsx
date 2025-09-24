import { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Upload, Wand2, Scissors, Palette, Sparkles, Image as ImageIcon, Square, Circle, Heart, Star, Zap, Sun, Moon, Cloud, TreePine, Mountain, Waves, Camera, Brush, Layers, RotateCcw } from 'lucide-react';
import { canvasPreview } from '@/utils/canvasPreview';
import { createQwenEditor } from '@/utils/qwenImageEditor';

interface ImageCropperProps {
  src: string | null;
  onCropComplete: (croppedImage: Blob) => void;
  onClose: () => void;
  aspect?: number;
}

interface AIEditButton {
  id: string;
  label: string;
  icon: any;
  description: string;
  category: 'background' | 'enhancement' | 'effects' | 'transform';
  prompt?: string;
}

// Helper function to convert image URL to data URL to avoid CORS issues
async function imageUrlToDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      try {
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

interface ImageCropperProps {
  src: string | null;
  onCropComplete: (croppedImage: Blob) => void;
  onClose: () => void;
  aspect?: number;
}

export function ImageCropper({ src, onCropComplete, onClose, aspect = 3 / 4 }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('crop');
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('natural');
  const [selectedShape, setSelectedShape] = useState<string>('original');
  const [selectedScenario, setSelectedScenario] = useState<string>('general');
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert external URL to data URL to avoid CORS issues
  useEffect(() => {
    if (src && src.startsWith('http')) {
      setIsLoading(true);
      imageUrlToDataUrl(src)
        .then(dataUrl => {
          setImageSrc(dataUrl);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error converting image to data URL:', error);
          // Fallback to original src
          setImageSrc(src);
          setIsLoading(false);
        });
    } else {
      setImageSrc(src);
    }
  }, [src]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
        width,
        height
      ));
    }
  }

  async function handleCrop() {
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;
    if (!image || !previewCanvas || !completedCrop) {
      return;
    }

    try {
      await canvasPreview(image, previewCanvas, completedCrop);
      
      previewCanvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
        } else {
          console.error('Failed to create blob from canvas');
          alert('Failed to crop image. Please try again.');
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to crop image. Please try again.');
    }
  }

  // Reset state when src changes
  useEffect(() => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setProcessedImage(null);
    setReferenceImages([]);
  }, [src]);

  // Handle reference image uploads
  const handleReferenceImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + referenceImages.length > 3) {
      alert('Maximum 3 reference images allowed');
      return;
    }
    setReferenceImages(prev => [...prev, ...files]);
  };

  // Remove reference image
  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  // AI Editing functions
  const processAIEdit = async (editType: string, useReferenceImage: boolean = false) => {
    console.log(`🔧 AI Edit Button Pressed: ${editType} (Reference: ${useReferenceImage})`); // Debug log for button press
    
    if (!imageSrc) {
      console.warn('No image source available for AI editing');
      return;
    }

    // Cleanup previous object URL
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }

    setIsProcessingAI(true);
    try {
      console.log(`📡 Using Supabase Edge Function for Qwen API`); // Debug log

      // Create Qwen editor instance (now uses Supabase function internally)
      const qwenEditor = createQwenEditor('', ''); // API key/endpoint not needed anymore

      // Convert current image to blob
      const imageBlob = await fetch(processedImage || imageSrc).then(r => r.blob());
      console.log(`🖼️ Image blob prepared: ${imageBlob.size} bytes`); // Debug log

      // Prepare edit request
      const editRequest = {
        image: imageBlob,
        edit_type: editType,
        reference_image: useReferenceImage && referenceImages.length > 0 ? referenceImages[0] : undefined,
        api_key: '', // Not needed with Supabase function
        api_endpoint: '', // Not needed with Supabase function
        options: {
          color: selectedColor,
          shape: selectedShape,
          scenario: selectedScenario
        }
      };

      console.log(`📝 Sending request to Supabase Edge Function for ${editType}`); // Debug log

      // Process with Qwen API via Supabase Edge Function
      const result = await qwenEditor.editImage(editRequest);

      console.log(`✅ Qwen API Response:`, result); // Debug log

      if (!result.success) {
        throw new Error(result.error || 'AI processing failed');
      }

      if (result.edited_image) {
        // Create local object URL from blob for preview and cropping
        const resultUrl = URL.createObjectURL(result.edited_image);
        setProcessedImage(resultUrl);
        setImageSrc(resultUrl); // Update main image for further editing
        setObjectUrl(resultUrl); // Track for cleanup
        console.log(`🎉 Edit completed successfully - local preview ready`); // Debug log
      }

    } catch (error) {
      console.error('AI processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Specific error handling
      if (errorMessage.includes('InvalidApiKey')) {
        alert(`API Key error. Please check that DASHSCOPE_API_KEY is set in Supabase secrets.`);
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
        alert(`Network error connecting to Supabase Edge Function. Check your connection.`);
      } else if (errorMessage.includes('No image generated')) {
        alert(`The API returned a description instead of an image. Try a different edit type or check the prompt.`);
      } else {
        alert(`AI processing failed: ${errorMessage}`);
      }
    } finally {
      setIsProcessingAI(false);
    }
  };

  const aiEditButtons: AIEditButton[] = [
    // Background operations
    { id: 'remove_bg', label: 'Remove Background', icon: Scissors, description: 'Remove image background', category: 'background' },
    { id: 'replace_bg_white', label: 'White Background', icon: Square, description: 'White solid background', category: 'background' },
    { id: 'replace_bg_black', label: 'Black Background', icon: Square, description: 'Black solid background', category: 'background' },
    { id: 'replace_bg_transparent', label: 'Transparent', icon: Square, description: 'Transparent background', category: 'background' },
    { id: 'replace_bg_gradient', label: 'Gradient Background', icon: Square, description: 'Beautiful gradient background', category: 'background' },
    { id: 'replace_bg_nature', label: 'Nature Background', icon: TreePine, description: 'Natural outdoor setting', category: 'background' },
    { id: 'replace_bg_studio', label: 'Studio Background', icon: Camera, description: 'Professional studio setup', category: 'background' },
    { id: 'replace_bg_custom', label: 'Custom Background', icon: ImageIcon, description: 'Use reference image', category: 'background' },

    // Enhancement operations
    { id: 'enhance_quality', label: 'Enhance Quality', icon: Sparkles, description: 'Improve sharpness & details', category: 'enhancement' },
    { id: 'enhance_colors', label: 'Vivid Colors', icon: Palette, description: 'Make colors more vibrant', category: 'enhancement' },
    { id: 'enhance_sharpness', label: 'Sharpen', icon: Zap, description: 'Increase image sharpness', category: 'enhancement' },
    { id: 'enhance_hdr', label: 'HDR Effect', icon: Sun, description: 'High dynamic range look', category: 'enhancement' },

    // Effects operations
    { id: 'effect_vintage', label: 'Vintage', icon: RotateCcw, description: 'Retro film look', category: 'effects' },
    { id: 'effect_bw', label: 'Black & White', icon: Moon, description: 'Classic monochrome', category: 'effects' },
    { id: 'effect_sepia', label: 'Sepia', icon: Sun, description: 'Warm brown tones', category: 'effects' },
    { id: 'effect_cartoon', label: 'Cartoon', icon: Star, description: 'Animated cartoon style', category: 'effects' },

    // Transform operations
    { id: 'transform_square', label: 'Square Format', icon: Square, description: 'Convert to square', category: 'transform' },
    { id: 'transform_portrait', label: 'Portrait', icon: ImageIcon, description: 'Vertical composition', category: 'transform' },
    { id: 'transform_landscape', label: 'Landscape', icon: Mountain, description: 'Horizontal composition', category: 'transform' },
    { id: 'transform_circle', label: 'Circular Crop', icon: Circle, description: 'Round composition', category: 'transform' }
  ];

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  return (
    <Dialog open={!!src} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden" aria-describedby="image-edit-description">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
          <p id="image-edit-description" className="text-sm text-muted-foreground">
            Crop and enhance your images with AI-powered editing tools
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="crop">Crop</TabsTrigger>
            <TabsTrigger value="ai-edit">AI Edit</TabsTrigger>
          </TabsList>

          <TabsContent value="crop" className="mt-4">
            <div className="flex gap-4">
              {/* Side AI Quick Actions */}
              <div className="flex flex-col gap-2 w-16">
                <Button
                  variant="outline"
                  size="sm"
                  className="p-2 h-12 w-12"
                  onClick={() => processAIEdit('remove_bg')}
                  disabled={isProcessingAI}
                  title="Remove Background"
                >
                  <Scissors className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="p-2 h-12 w-12"
                  onClick={() => processAIEdit('enhance')}
                  disabled={isProcessingAI}
                  title="Enhance Quality"
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="p-2 h-12 w-12"
                  onClick={() => processAIEdit('colorize')}
                  disabled={isProcessingAI}
                  title="Adjust Colors"
                >
                  <Palette className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="p-2 h-12 w-12"
                  onClick={() => setActiveTab('ai-edit')}
                  title="More AI Tools"
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Main Image Area */}
              <div className="flex-1 flex justify-center p-4">
                {isLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                      <p>Loading image...</p>
                    </div>
                  </div>
                ) : (
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                    minWidth={100}
                    minHeight={100}
                  >
                    <img
                      ref={imgRef}
                      alt="Crop me"
                      src={processedImage || imageSrc || ''}
                      onLoad={onImageLoad}
                      style={{ maxHeight: '60vh' }}
                    />
                  </ReactCrop>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai-edit" className="mt-4">
            <div className="space-y-4">
              {/* AI Options Dropdowns */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">AI Editing Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Color Style</label>
                      <Select value={selectedColor} onValueChange={setSelectedColor}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select color style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="natural">Natural</SelectItem>
                          <SelectItem value="vibrant">Vibrant</SelectItem>
                          <SelectItem value="muted">Muted</SelectItem>
                          <SelectItem value="warm">Warm</SelectItem>
                          <SelectItem value="cool">Cool</SelectItem>
                          <SelectItem value="monochrome">Monochrome</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Shape/Format</label>
                      <Select value={selectedShape} onValueChange={setSelectedShape}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="original">Original</SelectItem>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="landscape">Landscape</SelectItem>
                          <SelectItem value="circle">Circle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Scenario</label>
                      <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scenario" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="outdoor">Outdoor</SelectItem>
                          <SelectItem value="indoor">Indoor</SelectItem>
                          <SelectItem value="nature">Nature</SelectItem>
                          <SelectItem value="urban">Urban</SelectItem>
                          <SelectItem value="beach">Beach</SelectItem>
                          <SelectItem value="mountain">Mountain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reference Images Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Reference Images (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {referenceImages.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Reference ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <button
                          onClick={() => removeReferenceImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {referenceImages.length < 3 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:border-gray-400"
                      >
                        <Upload className="w-6 h-6 text-gray-400" />
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleReferenceImageUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500">Upload up to 3 reference images for AI editing</p>
                </CardContent>
              </Card>

              {/* Background Operations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Square className="w-4 h-4" />
                    Background
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {aiEditButtons.filter(btn => btn.category === 'background').map((button) => (
                      <Button
                        key={button.id}
                        variant="outline"
                        className="h-auto p-3 flex flex-col items-center gap-1 text-xs"
                        onClick={() => processAIEdit(button.id, button.id === 'replace_bg_custom')}
                        disabled={isProcessingAI || (button.id === 'replace_bg_custom' && referenceImages.length === 0)}
                      >
                        <button.icon className="w-5 h-5" />
                        <span className="text-center leading-tight">{button.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Enhancement Operations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Enhancement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {aiEditButtons.filter(btn => btn.category === 'enhancement').map((button) => (
                      <Button
                        key={button.id}
                        variant="outline"
                        className="h-auto p-3 flex flex-col items-center gap-1 text-xs"
                        onClick={() => processAIEdit(button.id)}
                        disabled={isProcessingAI}
                      >
                        <button.icon className="w-5 h-5" />
                        <span className="text-center leading-tight">{button.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Effects Operations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brush className="w-4 h-4" />
                    Effects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {aiEditButtons.filter(btn => btn.category === 'effects').map((button) => (
                      <Button
                        key={button.id}
                        variant="outline"
                        className="h-auto p-3 flex flex-col items-center gap-1 text-xs"
                        onClick={() => processAIEdit(button.id)}
                        disabled={isProcessingAI}
                      >
                        <button.icon className="w-5 h-5" />
                        <span className="text-center leading-tight">{button.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Transform Operations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Transform
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {aiEditButtons.filter(btn => btn.category === 'transform').map((button) => (
                      <Button
                        key={button.id}
                        variant="outline"
                        className="h-auto p-3 flex flex-col items-center gap-1 text-xs"
                        onClick={() => processAIEdit(button.id)}
                        disabled={isProcessingAI}
                      >
                        <button.icon className="w-5 h-5" />
                        <span className="text-center leading-tight">{button.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Image Preview */}
              <div className="flex justify-center">
                {isProcessingAI ? (
                  <div className="flex flex-col items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                    <p>Processing with AI...</p>
                  </div>
                ) : (
                  <img
                    src={processedImage || imageSrc || ''}
                    alt="Current image"
                    className="max-h-60 object-contain border rounded"
                  />
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* This canvas is used to draw the cropped image and is not displayed */}
        <canvas ref={previewCanvasRef} style={{ display: 'none' }} />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCrop} disabled={isLoading || !completedCrop}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

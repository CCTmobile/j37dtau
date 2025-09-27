import { useState, useRef, useEffect, useId } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Upload, Wand2, Scissors, Palette, Sparkles, Image as ImageIcon, Square, Circle, Heart, Star, Zap, Sun, Moon, Cloud, TreePine, Mountain, Waves, Camera, Brush, Layers, RotateCcw, X, Wifi, WifiOff, Clock, AlertTriangle } from 'lucide-react';
import { canvasPreview } from '@/utils/canvasPreview';
import { createQwenEditor } from '@/utils/qwenImageEditor';
import { serviceWorkerManager, type AIProcessingCallbacks } from '@/utils/serviceWorkerManager';

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
  const descriptionId = useId();
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [finalCroppedImage, setFinalCroppedImage] = useState<Blob | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('natural');
  const [selectedShape, setSelectedShape] = useState<string>('original');
  const [selectedScenario, setSelectedScenario] = useState<string>('general');
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [aiQueueLength, setAiQueueLength] = useState(0);
  const [aiProcessingStatus, setAiProcessingStatus] = useState<string>('');
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const [processingElapsed, setProcessingElapsed] = useState<number>(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);

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

  // Log dialog and screen dimensions when dialog opens
  useEffect(() => {
    if (src) {
      console.log('🖼️ ImageCropper Dialog Opened');
      console.log('📱 Screen Dimensions:');
      console.table({
        'Inner Width': window.innerWidth,
        'Inner Height': window.innerHeight,
        'Available Width': window.screen.availWidth,
        'Available Height': window.screen.availHeight
      });

      // Log dimensions after dialog is rendered
      const logDimensions = () => {
        if (dialogContentRef.current) {
          const rect = dialogContentRef.current.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(dialogContentRef.current);
          
          console.log('📐 Dialog Content Dimensions:');
          console.table({
            'Actual Width': Math.round(rect.width),
            'Actual Height': Math.round(rect.height),
            'Top Position': Math.round(rect.top),
            'Left Position': Math.round(rect.left),
            'Right Position': Math.round(rect.right),
            'Bottom Position': Math.round(rect.bottom),
            'Computed Width': computedStyle.width,
            'Computed Height': computedStyle.height,
            'Computed Max Width': computedStyle.maxWidth,
            'Computed Max Height': computedStyle.maxHeight
          });

          // Log right column dimensions if available
          if (rightColumnRef.current) {
            const rightRect = rightColumnRef.current.getBoundingClientRect();
            const rightComputed = window.getComputedStyle(rightColumnRef.current);
            
            console.log('🎨 Right Column (AI Tools) Dimensions:');
            console.table({
              'Width': Math.round(rightRect.width),
              'Height': Math.round(rightRect.height),
              'Scroll Height': rightColumnRef.current.scrollHeight,
              'Client Height': rightColumnRef.current.clientHeight,
              'Is Overflowing': rightColumnRef.current.scrollHeight > rightColumnRef.current.clientHeight,
              'Computed Width': rightComputed.width,
              'Computed Height': rightComputed.height
            });
          }

          // Log viewport usage percentage
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          console.log('📊 Viewport Usage:');
          console.table({
            'Width Usage': ((rect.width / viewportWidth) * 100).toFixed(1) + '%',
            'Height Usage': ((rect.height / viewportHeight) * 100).toFixed(1) + '%',
            'Available Width Left': Math.round(viewportWidth - rect.width),
            'Available Height Left': Math.round(viewportHeight - rect.height)
          });
        }
      };

      // Log immediately and after a short delay to catch any layout shifts
      logDimensions();
      setTimeout(logDimensions, 100);
      setTimeout(logDimensions, 500);
      
      // Log AI tools rendering
      console.log('🤖 AI Tools Section should be rendered with', aiEditButtons.length, 'buttons across', 
        new Set(aiEditButtons.map(btn => btn.category)).size, 'categories');
    }
  }, [src]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    console.log('🖼️ Image loaded with dimensions:', width, 'x', height);
    
    if (aspect) {
      const newCrop = centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
        width,
        height
      );
      console.log('✂️ Setting initial crop area:', newCrop);
      setCrop(newCrop);
    }
  }

  // Updated handleCrop to use processedImage if available
  async function handleCrop() {
    console.log('🔄 Starting crop process...');
    console.log('📊 Crop data:', completedCrop);
    console.log('🖼️ Current image src:', imageSrc);
    console.log('🎨 Processed image:', processedImage);
    
    const image = imgRef.current;
    const previewCanvas = previewCanvasRef.current;
    
    console.log('🔍 Image element:', image);
    console.log('🎭 Preview canvas:', previewCanvas);
    
    if (!image || !previewCanvas || !completedCrop) {
      console.warn('❌ Missing required elements for cropping:', {
        hasImage: !!image,
        hasCanvas: !!previewCanvas,
        hasCrop: !!completedCrop
      });
      return;
    }

    try {
      console.log('🖼️ Image dimensions:', {
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        clientWidth: image.clientWidth,
        clientHeight: image.clientHeight
      });

      // Create temporary canvas to apply transformations
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error('Failed to get temp canvas context');

      // Set temp canvas size to image natural size
      tempCanvas.width = image.naturalWidth;
      tempCanvas.height = image.naturalHeight;

      console.log('🎨 Temp canvas size:', tempCanvas.width, 'x', tempCanvas.height);

      // Save context and apply transformations
      tempCtx.save();
      tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
      tempCtx.rotate((rotation * Math.PI) / 180);
      tempCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      tempCtx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
      tempCtx.restore();

      // Load transformed canvas as image for canvasPreview
      const tempImageUrl = tempCanvas.toDataURL();
      const tempImage = new Image();
      tempImage.src = tempImageUrl;
      await new Promise((resolve, reject) => {
        tempImage.onload = resolve;
        tempImage.onerror = reject;
      });

      console.log('🔄 Applying crop with canvasPreview...');
      // Now use the transformed tempImage for cropping
      await canvasPreview(tempImage, previewCanvas, completedCrop);
      
      console.log('💾 Converting to blob...');
      previewCanvas.toBlob((blob) => {
        if (blob) {
          console.log('✅ Crop successful! Blob size:', blob.size, 'bytes');
          onCropComplete(blob);
        } else {
          console.error('❌ Failed to create blob from canvas');
          alert('Failed to crop image. Please try again.');
        }
      }, 'image/png');
    } catch (error) {
      console.error('❌ Error cropping image:', error);
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

    setProcessingStartTime(Date.now());
    setProcessingElapsed(0);
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

      if (result.queued) {
        // Request was queued for retry - show positive message
        console.log('📋 Request queued for retry - showing user feedback');
        setAiProcessingStatus(`Request queued for retry (${result.networkStatus})`);
        setTimeout(() => setAiProcessingStatus(''), 5000);
        setIsProcessingAI(false);
        setProcessingStartTime(null);
        setProcessingElapsed(0);
        
        // Don't show error alert for queued requests
        return;
      }

      if (!result.success) {
        throw new Error(result.error || 'AI processing failed');
      }

      if (result.edited_image) {
        // Create local object URL from blob for preview and cropping
        const resultUrl = URL.createObjectURL(result.edited_image);
        setProcessedImage(resultUrl);
        setImageSrc(resultUrl); // Update main image for further editing
        setObjectUrl(resultUrl); // Track for cleanup
        
        // Reset crop area for the new image
        setCrop(undefined);
        setCompletedCrop(undefined);
        
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
      setProcessingStartTime(null);
      setProcessingElapsed(0);
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

  // Cleanup useEffect
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  useEffect(() => {
    if (!isProcessingAI || processingStartTime === null) {
      setProcessingElapsed(0);
      return;
    }

    const updateElapsed = () => {
      setProcessingElapsed(Math.max(0, Math.round((Date.now() - processingStartTime) / 1000)));
    };

    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);

    return () => window.clearInterval(interval);
  }, [isProcessingAI, processingStartTime]);

  // Service Worker AI Processing Setup
  useEffect(() => {
    const setupAIProcessing = async () => {
      // Register service worker if not already registered
      await serviceWorkerManager.register();

      // Set up callbacks for AI processing status
      const aiCallbacks: AIProcessingCallbacks = {
        onNetworkStatusChange: (online) => {
          setIsOnline(online);
          setAiProcessingStatus(online ? '' : 'Offline - requests will be queued');
        },
        onQueueUpdate: (queueLength, isProcessing) => {
          setAiQueueLength(queueLength);
          if (isProcessing && queueLength > 0) {
            setIsProcessingAI(true);
            setProcessingStartTime((prev) => prev ?? Date.now());
          } else {
            setIsProcessingAI(false);
            if (queueLength === 0) {
              setProcessingStartTime(null);
              setProcessingElapsed(0);
            }
          }
          if (queueLength > 0) {
            setAiProcessingStatus(`${queueLength} request${queueLength > 1 ? 's' : ''} queued`);
          } else if (!isProcessing) {
            setAiProcessingStatus('');
          }
        },
        onRequestQueued: (requestId, error) => {
          console.log(`📋 AI request queued: ${requestId} (${error})`);
          setAiProcessingStatus('Request queued for retry');
          setProcessingStartTime((prev) => prev ?? Date.now());
          setIsProcessingAI(true);
        },
        onRequestSuccess: (requestId, imageBlob) => {
          console.log(`✅ AI request successful: ${requestId}`);
          if (imageBlob) {
            // Convert the response data back to a blob and set as processed image
            try {
              // If imageBlob is already a Blob, use it directly
              if (imageBlob instanceof Blob) {
                const resultUrl = URL.createObjectURL(imageBlob);
                setProcessedImage(resultUrl);
                setImageSrc(resultUrl);
                setObjectUrl(resultUrl);
                setCrop(undefined);
                setCompletedCrop(undefined);
                console.log('🎉 Processed image loaded from service worker retry');
              }
            } catch (error) {
              console.error('❌ Failed to process image from service worker:', error);
            }
          }
          setAiProcessingStatus('Processing complete!');
          setTimeout(() => setAiProcessingStatus(''), 3000);
          setIsProcessingAI(false);
          setProcessingStartTime(null);
          setProcessingElapsed(0);
        },
        onRequestFailed: (requestId, error, maxRetriesExceeded) => {
          console.log(`❌ AI request failed: ${requestId} (${error})`);
          if (maxRetriesExceeded) {
            setAiProcessingStatus('Processing failed - please try again');
          } else {
            setAiProcessingStatus('Retrying...');
          }
          if (maxRetriesExceeded) {
            setIsProcessingAI(false);
            setProcessingStartTime(null);
            setProcessingElapsed(0);
          }
        }
      };

      serviceWorkerManager.setAICallbacks(aiCallbacks);

      // Get initial status
      const initialStatus = await serviceWorkerManager.getAIStatus();
      setIsOnline(initialStatus.isOnline);
      setAiQueueLength(initialStatus.queueLength);
    };

    setupAIProcessing();
  }, []);

  const resetAll = () => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setFinalCroppedImage(null);
    setProcessedImage(null);
    setReferenceImages([]);
    setSelectedColor('natural');
    setSelectedShape('original');
    setSelectedScenario('general');
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setImageSrc(src); // Restore original
    setObjectUrl(null);
  };

  const formattedProcessingTime = new Date(Math.max(processingElapsed, 0) * 1000).toISOString().substring(14, 19);
  const canSave = !isLoading && (!isProcessingAI || finalCroppedImage !== null || processedImage !== null);

  return (
    <Dialog open={!!src} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        ref={dialogContentRef}
        className="flex flex-col bg-neutral-950/95 text-neutral-100 border-neutral-800 shadow-2xl"
        style={{ width: '100vw', height: '80vh', maxWidth: 'none', maxHeight: 'none' }}
        aria-describedby={descriptionId}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">Edit Image</DialogTitle>
          <DialogDescription id={descriptionId} className="text-neutral-300">
            Crop and enhance your images with AI-powered editing tools
          </DialogDescription>
        </DialogHeader>

        {/* Professional Three-Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Cropping Controls */}
          <div className="w-64 border-r border-neutral-800 bg-gradient-to-b from-neutral-950/80 via-neutral-950/70 to-neutral-950/80 overflow-y-auto text-neutral-100">
            <div className="p-3 space-y-3">
              <Card className="bg-neutral-900/70 border-neutral-800 text-neutral-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-sm">Crop Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium mb-2 block">Aspect Ratio</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            const img = imgRef.current;
                            if (img) {
                              setCrop(centerCrop(
                                makeAspectCrop({ unit: '%', width: 90 }, 1, img.naturalWidth, img.naturalHeight),
                                img.naturalWidth,
                                img.naturalHeight
                              ));
                            }
                          }}
                        >
                          1:1 Square
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            const img = imgRef.current;
                            if (img) {
                              setCrop(centerCrop(
                                makeAspectCrop({ unit: '%', width: 90 }, 4/3, img.naturalWidth, img.naturalHeight),
                                img.naturalWidth,
                                img.naturalHeight
                              ));
                            }
                          }}
                        >
                          4:3
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            const img = imgRef.current;
                            if (img) {
                              setCrop(centerCrop(
                                makeAspectCrop({ unit: '%', width: 90 }, 16/9, img.naturalWidth, img.naturalHeight),
                                img.naturalWidth,
                                img.naturalHeight
                              ));
                            }
                          }}
                        >
                          16:9
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            const img = imgRef.current;
                            if (img) {
                              setCrop(centerCrop(
                                makeAspectCrop({ unit: '%', width: 90 }, 3/4, img.naturalWidth, img.naturalHeight),
                                img.naturalWidth,
                                img.naturalHeight
                              ));
                            }
                          }}
                        >
                          3:4 Portrait
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-2 block">Orientation</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => setRotation((prev) => prev + 90)}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Rotate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => setFlipH(!flipH)}
                        >
                          ↔️ Flip H
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => setFlipV(!flipV)}
                        >
                          ↕️ Flip V
                        </Button>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        setCrop(undefined);
                        setCompletedCrop(undefined);
                      }}
                    >
                      Reset Crop
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      className="w-full text-xs bg-blue-600 hover:bg-blue-700"
                      onClick={async () => {
                        if (completedCrop && imgRef.current && previewCanvasRef.current) {
                          try {
                            // Generate the canvas preview
                            await canvasPreview(
                              imgRef.current,
                              previewCanvasRef.current,
                              completedCrop,
                              1,
                              0
                            );
                            
                            // Convert canvas to blob
                            previewCanvasRef.current.toBlob((blob) => {
                              if (blob) {
                                setFinalCroppedImage(blob);
                                console.log('✂️ Crop applied successfully:', { size: blob.size, type: blob.type });
                              } else {
                                console.error('❌ Failed to convert canvas to blob');
                              }
                            }, 'image/png');
                          } catch (error) {
                            console.error('❌ Failed to apply crop:', error);
                          }
                        } else {
                          console.warn('⚠️ No completed crop available');
                        }
                      }}
                      disabled={!completedCrop}
                    >
                      ✂️ Apply Crop
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full text-xs"
                      onClick={resetAll}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Reset All
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Processing Status */}
              {isProcessingAI && (
                <div className="p-3 rounded-lg border border-sky-500/50 bg-gradient-to-r from-sky-600/40 via-indigo-600/30 to-slate-900/60 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-sky-50">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-200"></div>
                      <span>Processing with AI...</span>
                    </div>
                    <span className="text-xs text-sky-100/80">{formattedProcessingTime}</span>
                  </div>
                  {aiProcessingStatus && (
                    <p className="mt-2 text-xs text-sky-100/70">{aiProcessingStatus}</p>
                  )}
                </div>
              )}

              {/* Crop Applied Status */}
              {finalCroppedImage && (
                <div className="p-3 rounded-lg border border-purple-500/50 bg-purple-900/40 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-purple-100">
                      <div className="font-medium">✅ Crop Applied</div>
                      <div className="text-xs">Ready to save changes</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-purple-400/40 text-purple-100 hover:bg-purple-500/20"
                      onClick={() => {
                        setFinalCroppedImage(null);
                        setCrop(undefined);
                        setCompletedCrop(undefined);
                      }}
                    >
                      Clear Crop
                    </Button>
                  </div>
                </div>
              )}

              {/* AI Image Save Button */}
              {processedImage && !isProcessingAI && (
                <div className="p-3 rounded-lg border border-emerald-500/50 bg-emerald-900/40 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-emerald-100">
                      <div className="font-medium">AI Edit Complete!</div>
                      <div className="text-xs">Save this result or continue editing</div>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600 text-xs text-neutral-900"
                      onClick={async () => {
                        try {
                          // Convert the processed image to blob and set as the new current image
                          const response = await fetch(processedImage);
                          const blob = await response.blob();
                          
                          // Create object URL for the new current image
                          const newImageUrl = URL.createObjectURL(blob);
                          
                          // Update the image source and clear processed image
                          setImageSrc(newImageUrl);
                          setProcessedImage(null);
                          
                          // Reset crop area for the new image
                          setCrop(undefined);
                          setCompletedCrop(undefined);
                          
                          console.log('✅ AI image saved as current image');
                        } catch (error) {
                          console.error('❌ Failed to save AI image:', error);
                        }
                      }}
                    >
                      💾 Save AI Image
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Column: Main Image Display & Cropper */}
          <div className="flex-1 flex flex-col bg-neutral-950/40">
            <div className="flex-1 flex justify-center items-center p-6 bg-neutral-900/60">
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-600">Loading image...</p>
                  </div>
                </div>
              ) : imageSrc ? (
                <div className="w-full h-full flex justify-center items-center">
                  <div className="p-12 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl min-w-[400px] min-h-[800px] overflow-hidden">
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={aspect}
                      minWidth={50}
                      minHeight={50}
                      className="max-w-full max-h-full"
                    >
                      <img
                        ref={imgRef}
                        alt="Edit this image"
                        src={processedImage || imageSrc}
                        onLoad={onImageLoad}
                        className="max-w-full max-h-full object-contain"
                        style={{ 
                          display: 'block',
                          transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                          transformOrigin: 'center center'
                        }}
                      />
                    </ReactCrop>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center">
                  <p className="text-neutral-400">No image to display</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: AI Editing Tools Sidebar */}
          <div ref={rightColumnRef} className="w-96 border-l border-neutral-800 bg-gradient-to-b from-neutral-950/80 via-neutral-950/70 to-neutral-950/80 overflow-y-auto text-neutral-100">
            <div className="p-4 space-y-4">
              {/* AI Options Dropdowns */}
              <Card className="bg-neutral-900/70 border-neutral-800 text-neutral-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-neutral-100">
                    AI Editing Options
                    {isOnline ? (
                      <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-500" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Network Status and Queue Indicator */}
                  {(!isOnline || aiQueueLength > 0 || aiProcessingStatus) && (
                    <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-sky-600/40 via-indigo-600/30 to-slate-800/40 border border-sky-500/40 shadow-lg">
                      <div className="flex items-center gap-2 text-sm text-sky-100 mb-2">
                        {!isOnline ? (
                          <WifiOff className="w-4 h-4" />
                        ) : aiQueueLength > 0 ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        <span>
                          {!isOnline && "Offline - AI requests will be queued"}
                          {isOnline && aiQueueLength > 0 && `${aiQueueLength} request${aiQueueLength > 1 ? 's' : ''} queued for processing`}
                          {isOnline && aiQueueLength === 0 && aiProcessingStatus && aiProcessingStatus}
                        </span>
                      </div>
                      
                      {/* Queue Management */}
                      {aiQueueLength > 0 && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => serviceWorkerManager.retryFailedRequests()}
                            disabled={!isOnline}
                          >
                            🔄 Retry All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-red-600 hover:text-red-700"
                            onClick={() => serviceWorkerManager.clearQueue()}
                          >
                            🗑️ Clear Queue
                          </Button>
                        </div>
                      )}
                      
                      {!isOnline && aiQueueLength > 0 && (
                        <button
                          onClick={() => serviceWorkerManager.retryFailedRequests()}
                          className="mt-2 text-xs text-sky-200 hover:text-sky-100 underline"
                        >
                          Retry when online
                        </button>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Color Style</label>
                      <Select value={selectedColor} onValueChange={setSelectedColor}>
                        <SelectTrigger className="bg-neutral-900 border-neutral-700 text-neutral-100">
                          <SelectValue placeholder="Select color style" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-900 border border-neutral-700 text-neutral-100">
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
                        <SelectTrigger className="bg-neutral-900 border-neutral-700 text-neutral-100">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-900 border border-neutral-700 text-neutral-100">
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
                        <SelectTrigger className="bg-neutral-900 border-neutral-700 text-neutral-100">
                          <SelectValue placeholder="Select scenario" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-900 border border-neutral-700 text-neutral-100">
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
              <Card className="bg-neutral-900/70 border-neutral-800 text-neutral-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-sm text-neutral-100">Reference Images (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {referenceImages.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Reference ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border border-neutral-700"
                        />
                        <button
                          onClick={() => removeReferenceImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center shadow"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {referenceImages.length < 3 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-16 h-16 border-2 border-dashed border-neutral-600 rounded flex items-center justify-center hover:border-neutral-400"
                      >
                        <Upload className="w-6 h-6 text-neutral-400" />
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
                  <p className="text-xs text-neutral-400">Upload up to 3 reference images for AI editing</p>
                </CardContent>
              </Card>

              {/* Collapsible AI Tool Categories */}
              <Card className="bg-neutral-900/70 border-neutral-800 text-neutral-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-sm text-neutral-100">AI Editing Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full space-y-2">
                    {/* Background Operations */}
                    <AccordionItem value="background" className="border rounded-lg">
                      <AccordionTrigger className="px-3 py-2 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Background
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-2 pb-2">
                        <div className="grid grid-cols-2 gap-3 p-2">
                          {aiEditButtons.filter(btn => btn.category === 'background').map((button) => (
                            <Button
                              key={button.id}
                              variant="outline"
                              size="sm"
                              className="h-20 p-2 flex flex-col items-center justify-center gap-1 text-xs min-w-0"
                              onClick={() => processAIEdit(button.id, button.id === 'replace_bg_custom')}
                              disabled={isProcessingAI || (button.id === 'replace_bg_custom' && referenceImages.length === 0)}
                            >
                              <button.icon className="w-5 h-5 flex-shrink-0" />
                              <span className="text-center leading-tight truncate max-w-full">{button.label}</span>
                            </Button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Enhancement Operations */}
                    <AccordionItem value="enhancement" className="border rounded-lg">
                      <AccordionTrigger className="px-3 py-2 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Enhancement
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-2 pb-2">
                        <div className="grid grid-cols-2 gap-3 p-2">
                          {aiEditButtons.filter(btn => btn.category === 'enhancement').map((button) => (
                            <Button
                              key={button.id}
                              variant="outline"
                              size="sm"
                              className="h-20 p-2 flex flex-col items-center justify-center gap-1 text-xs min-w-0"
                              onClick={() => processAIEdit(button.id)}
                              disabled={isProcessingAI}
                            >
                              <button.icon className="w-5 h-5 flex-shrink-0" />
                              <span className="text-center leading-tight truncate max-w-full">{button.label}</span>
                            </Button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Effects Operations */}
                    <AccordionItem value="effects" className="border rounded-lg">
                      <AccordionTrigger className="px-3 py-2 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Wand2 className="w-4 h-4" />
                          Effects
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-2 pb-2">
                        <div className="grid grid-cols-2 gap-3 p-2">
                          {aiEditButtons.filter(btn => btn.category === 'effects').map((button) => (
                            <Button
                              key={button.id}
                              variant="outline"
                              size="sm"
                              className="h-20 p-2 flex flex-col items-center justify-center gap-1 text-xs min-w-0"
                              onClick={() => processAIEdit(button.id)}
                              disabled={isProcessingAI}
                            >
                              <button.icon className="w-5 h-5 flex-shrink-0" />
                              <span className="text-center leading-tight truncate max-w-full">{button.label}</span>
                            </Button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Transform Operations */}
                    <AccordionItem value="transform" className="border rounded-lg">
                      <AccordionTrigger className="px-3 py-2 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <RotateCcw className="w-4 h-4" />
                          Transform
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-2 pb-2">
                        <div className="grid grid-cols-2 gap-3 p-2">
                          {aiEditButtons.filter(btn => btn.category === 'transform').map((button) => (
                            <Button
                              key={button.id}
                              variant="outline"
                              size="sm"
                              className="h-20 p-2 flex flex-col items-center justify-center gap-1 text-xs min-w-0"
                              onClick={() => processAIEdit(button.id)}
                              disabled={isProcessingAI}
                            >
                              <button.icon className="w-5 h-5 flex-shrink-0" />
                              <span className="text-center leading-tight truncate max-w-full">{button.label}</span>
                            </Button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Hidden Canvas for Cropping */}
        <canvas ref={previewCanvasRef} style={{ display: 'none' }} />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={async () => {
              try {
                let imageToSave: Blob;
                
                if (finalCroppedImage) {
                  // Use the cropped image
                  imageToSave = finalCroppedImage;
                  console.log('💾 Saving cropped image:', { size: imageToSave.size, type: imageToSave.type });
                } else if (processedImage) {
                  // Use the AI processed image
                  const response = await fetch(processedImage);
                  imageToSave = await response.blob();
                  console.log('💾 Saving AI processed image:', { size: imageToSave.size, type: imageToSave.type });
                } else {
                  // Use the original image
                  const response = await fetch(imageSrc!);
                  imageToSave = await response.blob();
                  console.log('💾 Saving original image:', { size: imageToSave.size, type: imageToSave.type });
                }
                
                onCropComplete(imageToSave);
                onClose();
              } catch (error) {
                console.error('❌ Failed to save image:', error);
                alert('Failed to save image. Please try again.');
              }
            }} 
            disabled={!canSave}
            className="bg-rose-500 hover:bg-rose-600 text-white disabled:bg-neutral-700 disabled:text-neutral-400"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

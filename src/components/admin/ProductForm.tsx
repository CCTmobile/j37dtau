import { useState, useRef, useCallback, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Plus, Upload, X, Image as ImageIcon, AlertCircle, CheckCircle, Trash2, Save, Crop, ChevronDown, RotateCcw } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import ImageUploadService, { ImageUploadOptions } from '../../utils/imageUpload';
import { createProduct, updateProduct } from '../../utils/supabase/client';
import { toast } from 'sonner';
import type { Product } from '../../App';
import { ImageCropper } from './ImageCropper';
import type { CropCompletionResult, EditHistoryEntry } from './ImageCropper';
import type { StoredAiRun } from '../../utils/qwenImageEditor';

const createUploadedImageId = () => (
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
);

export interface CropImageContext {
  index: number;
  src: string;
  type: 'new' | 'existing';
  form: 'create' | 'edit';
  history?: EditHistoryEntry[];
}

interface ProductFormProps {
  mode?: 'create' | 'edit';
  product?: Product | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  onCropImage?: (context: CropImageContext) => void;
  onCropComplete?: (result: CropCompletionResult, croppingContext: { index: number; type: 'new' | 'existing' }) => void;
}

interface UploadedImage {
  id: string;
  createdAt: number;
  file: File;
  preview: string;
  previewIsObjectUrl: boolean;
  url?: string;
  thumbnailUrl?: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  progress: number;
  replacementFor?: string;
  storedRun: StoredAiRun | null;
  source: 'new' | 'existing';
  editType?: string;
}

export interface ProductFormRef {
  handleCropComplete: (result: CropCompletionResult, croppingContext: { index: number; type: 'new' | 'existing' }) => void;
}

const formatHistoryLabel = (image: UploadedImage) => {
  if (image.editType) {
    return image.editType
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  if (image.storedRun) {
    return 'AI Edit';
  }

  return image.source === 'existing' ? 'Replacement' : 'Upload';
};

const toHistoryEntry = (image: UploadedImage, overrides: Partial<EditHistoryEntry> = {}): EditHistoryEntry => {
  return {
    id: overrides.id ?? image.id,
    previewUrl: overrides.previewUrl ?? image.preview ?? image.storedRun?.publicUrl ?? '',
    thumbnailUrl: overrides.thumbnailUrl ?? image.thumbnailUrl ?? image.storedRun?.thumbnailUrl ?? image.preview,
    storedRun: overrides.storedRun ?? image.storedRun ?? null,
    label: overrides.label ?? formatHistoryLabel(image),
    createdAt: overrides.createdAt ?? image.createdAt ?? Date.now(),
    status: overrides.status ?? image.status,
    source: overrides.source ?? (image.storedRun ? 'ai' : image.source === 'existing' ? 'cropped' : 'upload'),
  };
};

interface PromoteAiRunResponse {
  runId: string;
  storagePath: string;
  thumbnailPath: string;
  publicUrl: string;
  thumbnailUrl?: string;
}

export const ProductForm = forwardRef<ProductFormRef, ProductFormProps>(({ mode = 'create', product = null, onSuccess, onCancel, onCropImage }, ref) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || 'Casual' as Product['category'],
    price: product?.price?.toString() || '',
    originalPrice: product?.originalPrice?.toString() || '',
    description: product?.description || '',
    inStock: product?.inStock ?? true,
    sizes: product?.sizes || ['S', 'M', 'L'],
    colors: product?.colors || ['Black', 'White'],
    images: product?.images || [] as string[]
  });

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(product?.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [newSizeInput, setNewSizeInput] = useState('');
  const [newColorInput, setNewColorInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingPreviewOverrides, setExistingPreviewOverrides] = useState<Record<string, string>>({});
  const existingOverrideUrlsRef = useRef<string[]>([]);

  const revokeIfObjectUrl = useCallback((url?: string | null) => {
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.debug('Preview cleanup failed', error);
      }
    }
  }, []);

  const replacementPreviewMap = useMemo(() => {
    const map: Record<string, { preview: string; status: UploadedImage['status']; progress: number }> = {};
    uploadedImages.forEach((img) => {
      if (img.replacementFor) {
        map[img.replacementFor] = {
          preview: img.preview,
          status: img.status,
          progress: img.progress,
        };
      }
    });
    return map;
  }, [uploadedImages]);

  const newImageQueue = useMemo(() => (
    uploadedImages
      .map((img, index) => ({ img, index }))
      .filter(({ img }) => !img.replacementFor)
  ), [uploadedImages]);

  useEffect(() => {
    existingOverrideUrlsRef.current = Object.values(existingPreviewOverrides).filter(url => url.startsWith('blob:'));
  }, [existingPreviewOverrides]);

  const resetExistingImageReplacement = useCallback((imageUrl: string) => {
    setUploadedImages((prev) => {
      const updated: UploadedImage[] = [];
      prev.forEach((img) => {
        if (img.replacementFor === imageUrl) {
          if (img.previewIsObjectUrl) {
            revokeIfObjectUrl(img.preview);
          }
        } else {
          updated.push(img);
        }
      });
      return updated;
    });
    setExistingPreviewOverrides((prev) => {
      const updated = { ...prev };
      const previousOverride = updated[imageUrl];
      if (previousOverride) {
        revokeIfObjectUrl(previousOverride);
        delete updated[imageUrl];
      }
      return updated;
    });
  }, []);

  const getHistoryForExistingImage = useCallback((imageUrl: string, position: number): EditHistoryEntry[] => {
    const baseEntry: EditHistoryEntry = {
      id: `existing-${position}`,
      previewUrl: imageUrl,
      thumbnailUrl: imageUrl,
      storedRun: null,
      label: 'Original',
      createdAt: 0,
      status: 'completed',
      source: 'upload',
    };

    const replacementEntries = uploadedImages
      .filter((img) => img.replacementFor === imageUrl)
      .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
      .map((img) => toHistoryEntry(img));

    return [baseEntry, ...replacementEntries];
  }, [uploadedImages]);

  const getHistoryForNewImage = useCallback((index: number): EditHistoryEntry[] => {
    const target = uploadedImages[index];
    if (!target) {
      return [];
    }
    return [toHistoryEntry(target)];
  }, [uploadedImages]);

  // Expose handleCropComplete method to parent
  useImperativeHandle(ref, () => ({
    handleCropComplete: (result: CropCompletionResult, croppingContext: { index: number; type: 'new' | 'existing' }) => {
      const timestamp = Date.now();
      const editTypeLabel = result.storedRun ? 'ai edit' : result.source === 'cropped' ? 'manual crop' : 'upload';
      const mimeType = result.storedRun?.mimeType ?? result.blob.type ?? 'image/png';
      const extension = mimeType.split('/')[1] || 'png';
      const fileName = result.storedRun ? `ai-edit.${extension}` : `cropped_image.${extension}`;
      const croppedFile = new File([result.blob], fileName, { type: mimeType });

      const previewUrl = result.storedRun
        ? result.storedRun.thumbnailUrl || result.storedRun.publicUrl
        : URL.createObjectURL(croppedFile);
      const previewIsObjectUrl = !result.storedRun;

      if (croppingContext.type === 'new') {
        setUploadedImages(prev => {
          const newImages = [...prev];
          const target = newImages[croppingContext.index];
          if (target) {
            if (target.previewIsObjectUrl) {
              revokeIfObjectUrl(target.preview);
            }
            newImages[croppingContext.index] = {
              ...target,
              id: target.id ?? createUploadedImageId(),
              createdAt: timestamp,
              file: croppedFile,
              preview: previewUrl,
              previewIsObjectUrl,
              status: 'pending',
              progress: 0,
              storedRun: result.storedRun ?? null,
              error: undefined,
              source: 'new',
              editType: editTypeLabel,
            };
          }
          return newImages;
        });
      } else {
        const originalUrl = existingImages[croppingContext.index];
        if (!originalUrl) {
          toast.error('Unable to locate original image for replacement');
          return;
        }

        setExistingPreviewOverrides((prev) => {
          const updated = { ...prev };
          const previousOverride = updated[originalUrl];
          if (previousOverride) {
            revokeIfObjectUrl(previousOverride);
          }
          updated[originalUrl] = previewUrl;
          return updated;
        });

        setUploadedImages(prev => {
          const updated = [...prev];
          const existingReplacementIndex = updated.findIndex(img => img.replacementFor === originalUrl);

          if (existingReplacementIndex !== -1) {
            const previousPreview = updated[existingReplacementIndex].preview;
            if (updated[existingReplacementIndex].previewIsObjectUrl) {
              revokeIfObjectUrl(previousPreview);
            }
            updated[existingReplacementIndex] = {
              ...updated[existingReplacementIndex],
              id: updated[existingReplacementIndex].id ?? createUploadedImageId(),
              createdAt: timestamp,
              file: croppedFile,
              preview: previewUrl,
              previewIsObjectUrl,
              status: 'pending',
              progress: 0,
              storedRun: result.storedRun ?? null,
              error: undefined,
              source: 'existing',
              editType: editTypeLabel,
            };
          } else {
            updated.push({
              id: createUploadedImageId(),
              createdAt: timestamp,
              file: croppedFile,
              preview: previewUrl,
              previewIsObjectUrl,
              status: 'pending',
              progress: 0,
              replacementFor: originalUrl,
              storedRun: result.storedRun ?? null,
              source: 'existing',
              editType: editTypeLabel,
            });
          }

          return updated;
        });
      }

      toast.success(result.source === 'ai' ? 'AI image ready to apply.' : 'Image cropped successfully. Ready for upload.');
    }
  }));

  // Cleanup effect for object URLs
  useEffect(() => {
    return () => {
      // Clean up all preview URLs when component unmounts
      uploadedImages.forEach(img => {
        if (img.previewIsObjectUrl) {
          revokeIfObjectUrl(img.preview);
        }
      });
      existingOverrideUrlsRef.current.forEach((url) => {
        revokeIfObjectUrl(url);
      });
    };
  }, [uploadedImages]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validation = ImageUploadService.validateFile(file);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Create preview URLs and add to state with 'pending' status
    const newImages: UploadedImage[] = validFiles.map(file => ({
      id: createUploadedImageId(),
      createdAt: Date.now(),
      file,
      preview: URL.createObjectURL(file),
      previewIsObjectUrl: true,
      status: 'pending' as const,
      progress: 0,
      storedRun: null,
      source: 'new',
      editType: 'upload',
    }));

    setUploadedImages(prev => [...prev, ...newImages]);
    toast.success(`${validFiles.length} image(s) ready for upload`);
  };

  const removeImage = (index: number) => {
    const imageToRemove = uploadedImages[index];

    // Clean up preview URL
    if (imageToRemove.previewIsObjectUrl) {
      revokeIfObjectUrl(imageToRemove.preview);
    }

    // If the image was already uploaded to storage, we should delete it
    if (imageToRemove.url) {
      ImageUploadService.deleteImage(imageToRemove.url).catch(error => {
        console.warn('Failed to delete image from storage:', error);
      });
    }

    // Remove from uploaded images
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageUrl: string) => {
    resetExistingImageReplacement(imageUrl);
    setExistingImages(prev => prev.filter(img => img !== imageUrl));
  };

  const addSize = () => {
    if (newSizeInput.trim() && !formData.sizes.includes(newSizeInput.trim())) {
      setFormData(prev => ({
        ...prev,
        sizes: [...prev.sizes, newSizeInput.trim()]
      }));
      setNewSizeInput('');
    }
  };

  const removeSize = (size: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter(s => s !== size)
    }));
  };

  const addColor = () => {
    if (newColorInput.trim() && !formData.colors.includes(newColorInput.trim())) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, newColorInput.trim()]
      }));
      setNewColorInput('');
    }
  };

  const removeColor = (color: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c !== color)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!formData.price || isNaN(parseFloat(formData.price))) {
      toast.error('Valid price is required');
      return;
    }

    if (uploadedImages.some(img => img.status === 'uploading')) {
      toast.error('Please wait for all images to finish uploading');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const productData = {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        description: formData.description,
        in_stock: formData.inStock,
        sizes: formData.sizes,
        colors: formData.colors,
        images: [...existingImages] // Start with existing images
      };

      let targetProductId: string;

      if (mode === 'edit' && product?.id) {
        // Update existing product
        await updateProduct(product.id, productData);
        targetProductId = product.id;
      } else {
        // Create new product
        const createdProduct = await createProduct(productData) as { id: string } | null;
        if (!createdProduct || !createdProduct.id) {
          throw new Error('Failed to create product');
        }
        targetProductId = createdProduct.id;
      }

      // Upload new images if any
      let finalImageUrls = [...existingImages];

      if (uploadedImages.length > 0) {
        const replacementTargets = uploadedImages.map(img => img.replacementFor ?? null);
        const updatedExistingImages = [...existingImages];
        const addedImageUrls: string[] = [];

        // Update image statuses to uploading
        setUploadedImages(prev =>
          prev.map(img => ({ ...img, status: 'uploading' as const, progress: 0 }))
        );

        // Prepare files for upload
        const filesToUpload = uploadedImages.map(img => img.file);

        // Upload options
        const uploadOptions: ImageUploadOptions = {
          format: 'webp',
          quality: 0.85,
          generateSizes: true
        };

        // Upload images with progress tracking
        const results = await ImageUploadService.uploadMultipleImages(
          filesToUpload,
          targetProductId,
          uploadOptions,
          (fileIndex, progress) => {
            setUploadedImages(prev =>
              prev.map((img, index) =>
                index === fileIndex
                  ? { ...img, progress: progress.percentage }
                  : img
              )
            );
            setUploadProgress(Math.round((fileIndex + progress.percentage / 100) / filesToUpload.length * 100));
          },
          (fileIndex, result) => {
            setUploadedImages(prev =>
              prev.map((img, index) =>
                index === fileIndex
                  ? {
                      ...img,
                      status: 'completed' as const,
                      url: result.url,
                      thumbnailUrl: result.thumbnailUrl,
                      progress: 100
                    }
                  : img
              )
            );

            const replacementTarget = replacementTargets[fileIndex];
            if (replacementTarget) {
              const replaceIndex = updatedExistingImages.indexOf(replacementTarget);
              if (replaceIndex !== -1) {
                updatedExistingImages[replaceIndex] = result.url;
              } else {
                addedImageUrls.push(result.url);
              }
            } else {
              addedImageUrls.push(result.url);
            }
          }
        ).catch(async (error) => {
          console.error('Upload failed:', error);

          // Check bucket and permissions
          console.log('Checking bucket existence...');
          const bucketExists = await ImageUploadService.checkBucketExists();
          console.log('Bucket exists:', bucketExists);

          if (!bucketExists) {
            toast.error('Image storage bucket is not accessible');
            return [];
          }

          // Try direct bucket access
          console.log('Checking direct bucket access...');
          const directCheck = await ImageUploadService.checkBucketDirectly();
          console.log('Direct bucket access:', directCheck);

          toast.error(`Upload failed: ${error.message}`);
          return [];
        });

        if (results.length > 0 || addedImageUrls.length > 0) {
          // Build final image list combining updated existing images with new additions
          finalImageUrls = [...updatedExistingImages, ...addedImageUrls];

          // Ensure final list has unique URLs to avoid duplicates in case of replacements
          finalImageUrls = Array.from(new Set(finalImageUrls));
        } else {
          finalImageUrls = [...existingImages];
        }

        await updateProduct(targetProductId, { images: finalImageUrls });

        toast.success(`${mode === 'edit' ? 'Updated' : 'Created'} product with ${results.length} new image(s)`);
      } else {
        // No new images, just update with current existing images
        await updateProduct(targetProductId, { images: finalImageUrls });
        toast.success(`Product ${mode === 'edit' ? 'updated' : 'created'} successfully!`);
      }

      // Clear any temporary overrides now that images are synced
      Object.values(existingPreviewOverrides).forEach((overrideUrl) => {
        try {
          URL.revokeObjectURL(overrideUrl);
        } catch (err) {
          console.debug('Preview override cleanup failed after upload', err);
        }
      });
      setExistingPreviewOverrides({});
      existingOverrideUrlsRef.current = [];

      onSuccess?.();

      // Reset form if creating
      if (mode === 'create') {
        setFormData({
          name: '',
          category: 'Casual',
          price: '',
          originalPrice: '',
          description: '',
          inStock: true,
          sizes: ['S', 'M', 'L'],
          colors: ['Black', 'White'],
          images: []
        });
        setExistingImages([]);
      } else {
        setExistingImages(finalImageUrls);
      }

      // Clean up preview URLs
      uploadedImages.forEach(img => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });

      setUploadedImages([]);
      setUploadProgress(0);

    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} product:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${mode === 'edit' ? 'update' : 'create'} product`);

      // Mark failed images
      setUploadedImages(prev =>
        prev.map(img =>
          img.status === 'uploading'
            ? { ...img, status: 'error' as const, error: 'Upload failed' }
            : img
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full bg-neutral-900/60 backdrop-blur border-neutral-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {mode === 'edit' ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {mode === 'edit' ? 'Edit Product' : 'Add New Product'}
          </CardTitle>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Accordion type="multiple" defaultValue={["basic","pricing","inventory","media"]} className="w-full">
            <AccordionItem value="basic">
              <AccordionTrigger className="text-sm font-medium">Basic Information</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="product-name">Product Name *</Label>
                  <Input
                    id="product-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: Product['category']) =>
                      setFormData(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Party">Party</SelectItem>
                      <SelectItem value="Shoes">Shoes</SelectItem>
                      <SelectItem value="Outwear">Outwear</SelectItem>
                      <SelectItem value="Dresses">Dresses</SelectItem>
                      <SelectItem value="Accessories">Accessories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="pricing">
              <AccordionTrigger className="text-sm font-medium">Pricing</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="original-price">Original Price (for sales)</Label>
                    <Input
                      id="original-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="inventory">
              <AccordionTrigger className="text-sm font-medium">Inventory & Variants</AccordionTrigger>
              <AccordionContent className="space-y-5 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="in-stock"
                    checked={formData.inStock}
                    onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, inStock: checked }))}
                  />
                  <Label htmlFor="in-stock">In Stock</Label>
                </div>
                <div>
                  <Label>Sizes</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newSizeInput}
                      onChange={(e) => setNewSizeInput(e.target.value)}
                      placeholder="Add size (e.g., XL)"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                    />
                    <Button type="button" variant="outline" onClick={addSize}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.sizes.map((size) => (
                      <Badge key={size} variant="secondary" className="flex items-center gap-1">
                        {size}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeSize(size)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Colors</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newColorInput}
                      onChange={(e) => setNewColorInput(e.target.value)}
                      placeholder="Add color (e.g., Red)"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                    />
                    <Button type="button" variant="outline" onClick={addColor}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.colors.map((color) => (
                      <Badge key={color} variant="secondary" className="flex items-center gap-1">
                        {color}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeColor(color)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="media">
              <AccordionTrigger className="text-sm font-medium">Media & Images</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div>
                  <Label>Product Images</Label>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Current Images:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((imageUrl, index) => (
                    <div key={`existing-${index}`} className="relative group">
                      {(() => {
                        const replacement = replacementPreviewMap[imageUrl];
                        const overridePreview = existingPreviewOverrides[imageUrl];
                        const displaySrc = replacement?.preview ?? overridePreview ?? imageUrl;
                        const statusBadge = replacement?.status ?? (overridePreview ? 'pending' : undefined);

                        return (
                          <div className="aspect-square rounded-lg overflow-hidden border cursor-pointer" onClick={() => {
                            console.log('🖼️ Clicking existing image for cropping:', { index, imageUrl, mode });
                            onCropImage?.({
                              index,
                              src: displaySrc,
                              type: 'existing',
                              form: mode,
                              history: getHistoryForExistingImage(imageUrl, index),
                            });
                          }}>
                            <img
                              src={displaySrc}
                              alt={`Existing ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <Crop className="h-8 w-8 text-white opacity-0 group-hover:opacity-100" />
                            </div>
                            {(replacement || overridePreview) && (
                              <div className="absolute top-2 left-2">
                                <Badge variant="secondary" className="bg-amber-500/90 text-black shadow">
                                  {statusBadge === 'uploading' ? 'Uploading…' : statusBadge === 'completed' ? 'Updated' : 'Edited'}
                                </Badge>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={(e) => { e.stopPropagation(); removeExistingImage(imageUrl); }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      {(replacementPreviewMap[imageUrl] || existingPreviewOverrides[imageUrl]) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-7 w-7 rounded-full border border-white/40 bg-black/60 text-white"
                          onClick={(e) => { e.stopPropagation(); resetExistingImageReplacement(imageUrl); }}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Upload Section */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
              />

              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">
                    Drop new images here or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports JPEG, PNG, WebP, AVIF (max 10MB each)
                  </p>
                </div>
              </div>
            </div>

            {/* New Image Previews */}
            {newImageQueue.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">New Images to Upload:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {newImageQueue.map(({ img: image, index }) => (
                    <div key={`new-${index}`} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border cursor-pointer" onClick={() => {
                        console.log('🖼️ Clicking new image for cropping:', { index, preview: image.preview, mode });
                        onCropImage?.({
                          index,
                          src: image.preview,
                          type: 'new',
                          form: mode,
                          history: getHistoryForNewImage(index),
                        });
                      }}>
                        <img
                          src={image.preview}
                          alt={`New ${index + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Status Overlay */}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          {image.status === 'pending' && (
                             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <Crop className="h-8 w-8 text-white opacity-0 group-hover:opacity-100" />
                            </div>
                          )}
                          {image.status === 'uploading' && (
                            <div className="text-white text-center">
                              <div className="w-8 h-8 mx-auto mb-2">
                                <Progress value={image.progress} className="w-full h-full" />
                              </div>
                              <p className="text-xs">{image.progress}%</p>
                            </div>
                          )}

                          {image.status === 'completed' && (
                            <CheckCircle className="h-8 w-8 text-green-500" />
                          )}

                          {image.status === 'error' && (
                            <div className="text-center">
                              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-1" />
                              <p className="text-xs text-red-400">Failed</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Uploading images...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Debug Info */}
            {uploadedImages.some(img => img.status === 'error') && (
              <div className="mt-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Upload failed. Check browser console (F12) for detailed error information.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="flex gap-4 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1"
              disabled={isUploading || uploadedImages.some(img => img.status === 'uploading')}
            >
              {isUploading ? 'Uploading...' : mode === 'edit' ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </CardContent>
        </Card>
  );
});

ProductForm.displayName = 'ProductForm';
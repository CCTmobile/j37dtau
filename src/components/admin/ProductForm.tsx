import { useState, useRef, useCallback, useEffect } from 'react';
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
import { Plus, Upload, X, Image as ImageIcon, AlertCircle, CheckCircle, Trash2, Save, Crop } from 'lucide-react';
import ImageUploadService, { ImageUploadOptions } from '../../utils/imageUpload';
import { createProduct, updateProduct } from '../../utils/supabase/client';
import { toast } from 'sonner';
import type { Product } from '../../App';
import { ImageCropper } from './ImageCropper';

interface ProductFormProps {
  mode?: 'create' | 'edit';
  product?: Product | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface UploadedImage {
  file: File;
  preview: string;
  url?: string;
  thumbnailUrl?: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  progress: number;
}

export function ProductForm({ mode = 'create', product = null, onSuccess, onCancel }: ProductFormProps) {
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
  const [croppingImage, setCroppingImage] = useState<{ index: number; src: string; type: 'new' | 'existing' } | null>(null);

  // Cleanup effect for object URLs
  useEffect(() => {
    return () => {
      // Clean up all preview URLs when component unmounts
      uploadedImages.forEach(img => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [uploadedImages]);

  const handleCropComplete = (croppedImageBlob: Blob) => {
    if (!croppingImage) return;

    const croppedFile = new File([croppedImageBlob], "cropped_image.png", { type: "image/png" });
    const previewUrl = URL.createObjectURL(croppedFile);

    if (croppingImage.type === 'new') {
      setUploadedImages(prev => {
        const newImages = [...prev];
        const oldPreview = newImages[croppingImage.index].preview;
        URL.revokeObjectURL(oldPreview); // Clean up old preview
        newImages[croppingImage.index] = {
          ...newImages[croppingImage.index],
          file: croppedFile,
          preview: previewUrl,
          status: 'pending',
        };
        return newImages;
      });
    } else { // 'existing'
      // When an existing image is cropped, we treat it as a new image to be uploaded
      // and remove the old one from the existing list.
      setExistingImages(prev => prev.filter((_, index) => index !== croppingImage.index));
      setUploadedImages(prev => [
        ...prev,
        {
          file: croppedFile,
          preview: previewUrl,
          status: 'pending',
          progress: 0,
        }
      ]);
    }

    setCroppingImage(null);
    toast.success("Image cropped successfully. Ready for upload.");
  };

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
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
      progress: 0
    }));

    setUploadedImages(prev => [...prev, ...newImages]);
    toast.success(`${validFiles.length} image(s) ready for upload`);
  };

  const removeImage = (index: number) => {
    const imageToRemove = uploadedImages[index];

    // Clean up preview URL
    if (imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
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

        // Add new image URLs to the final list
        const newImageUrls = results.map(result => result.url);
        finalImageUrls = [...existingImages, ...newImageUrls];
        await updateProduct(targetProductId, { images: finalImageUrls });

        toast.success(`${mode === 'edit' ? 'Updated' : 'Created'} product with ${results.length} new image(s)`);
      } else {
        // No new images, just update with current existing images
        await updateProduct(targetProductId, { images: finalImageUrls });
        toast.success(`Product ${mode === 'edit' ? 'updated' : 'created'} successfully!`);
      }

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
    <Card className="w-full">
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
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="in-stock"
              checked={formData.inStock}
              onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, inStock: checked }))}
            />
            <Label htmlFor="in-stock">In Stock</Label>
          </div>

          {/* Sizes Management */}
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

          {/* Colors Management */}
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

          {/* Image Management */}
          <div>
            <Label>Product Images</Label>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Current Images:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((imageUrl, index) => (
                    <div key={`existing-${index}`} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border cursor-pointer" onClick={() => setCroppingImage({ index, src: imageUrl, type: 'existing' })}>
                        <img
                          src={imageUrl}
                          alt={`Existing ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <Crop className="h-8 w-8 text-white opacity-0 group-hover:opacity-100" />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={(e) => { e.stopPropagation(); removeExistingImage(imageUrl); }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
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
            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">New Images to Upload:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedImages.map((image, index) => (
                    <div key={`new-${index}`} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border cursor-pointer" onClick={() => setCroppingImage({ index, src: image.preview, type: 'new' })}>
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

          <div className="flex gap-4 pt-4">
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
        <ImageCropper
          src={croppingImage?.src || null}
          onClose={() => setCroppingImage(null)}
          onCropComplete={handleCropComplete}
        />
      </CardContent>
    </Card>
  );
}

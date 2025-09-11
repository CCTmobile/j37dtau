import { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { canvasPreview } from '@/utils/canvasPreview';

interface ImageCropperProps {
  src: string | null;
  onCropComplete: (croppedImage: Blob) => void;
  onClose: () => void;
  aspect?: number;
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
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

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
  }, [src]);

  if (!src) return null;

  return (
    <Dialog open={!!src} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p>Loading image...</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-4">
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
                src={imageSrc || ''}
                onLoad={onImageLoad}
                style={{ maxHeight: '70vh' }}
              />
            </ReactCrop>
          </div>
        )}
        {/* This canvas is used to draw the cropped image and is not displayed */}
        <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCrop} disabled={isLoading || !completedCrop}>
            Save Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

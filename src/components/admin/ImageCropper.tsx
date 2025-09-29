import { useState, useRef, useEffect, useId, useCallback, useMemo } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Upload, Wand2, Scissors, Palette, Sparkles, Image as ImageIcon, Square, Star, Zap, Sun, Moon, Brush, Layers, RotateCcw, Wifi, WifiOff, Clock, AlertTriangle, X } from 'lucide-react';
import { canvasPreview } from '@/utils/canvasPreview';
import { createQwenEditor } from '@/utils/qwenImageEditor';
import type { PromptTask, StoredAiRun } from '@/utils/qwenImageEditor';
import { serviceWorkerManager, type AIProcessingCallbacks } from '@/utils/serviceWorkerManager';

export interface EditHistoryEntry {
  id: string;
  previewUrl: string;
  thumbnailUrl?: string | null;
  storedRun: StoredAiRun | null;
  label?: string;
  createdAt?: number;
  status?: 'pending' | 'uploading' | 'completed' | 'error';
  source?: 'ai' | 'cropped' | 'upload';
}

export interface CropCompletionResult {
  blob: Blob;
  storedRun: StoredAiRun | null;
  source: 'original' | 'ai' | 'cropped';
  previewUrl?: string | null;
}

interface ImageCropperProps {
  src: string | null;
  onCropComplete: (result: CropCompletionResult) => void;
  onClose: () => void;
  aspect?: number;
  history?: EditHistoryEntry[];
}

type ReferenceContext = 'background' | 'pose' | 'style';

interface AIEditButton {
  id: string;
  label: string;
  icon: any;
  description: string;
  category: 'enhancement' | 'effects' | 'repair' | 'pose';
  prompt?: string;
  requiresReference?: boolean;
  task?: PromptTask;
  context?: ReferenceContext;
}

interface ProcessAIEditOptions {
  useReferenceImage?: boolean;
  customColor?: string;
  task?: PromptTask;
  context?: ReferenceContext;
  promptDetails?: CuratedBackgroundOptions;
}

interface BackgroundPreset {
  id: string;
  label: string;
  prompt: string;
  description: string;
}

interface BackgroundCategory {
  id: string;
  label: string;
  description: string;
  presets: BackgroundPreset[];
}

interface BackgroundRefinementOption {
  id: string;
  label: string;
  prompt: string;
}

interface CuratedBackgroundOptions {
  backgroundCategory?: string;
  backgroundPreset?: string;
  lightingStyle?: string;
  paletteStyle?: string;
  cameraAngle?: string;
  curatedPrompt?: string;
  customNotes?: string;
  curatedSource?: string;
  curatedSceneLabel?: string;
}

const CURATED_BACKGROUND_CATEGORIES: BackgroundCategory[] = [
  {
    id: 'indoors',
    label: 'Indoors',
    description: 'Polished interior environments ideal for lifestyle apparel photography.',
    presets: [
      {
        id: 'luxury_boutique',
        label: 'Luxury Boutique',
        description: 'Glass shelving, soft spotlights, elegant merchandising props.',
        prompt: 'Place the model inside a luxury fashion boutique with glass shelving, curated mannequins, and soft spotlights that highlight the garment without crowding the frame.'
      },
      {
        id: 'designer_showroom',
        label: 'Designer Showroom',
        description: 'Minimalist loft, tall windows, polished concrete, sculptural furniture.',
        prompt: 'Situate the subject in a minimalist designer showroom with tall windows, polished concrete floors, and sculptural furniture pieces placed artfully in the background.'
      },
      {
        id: 'atelier_corner',
        label: 'Atelier Corner',
        description: 'Warm atelier space with sewing table, dress forms, pattern paper.',
        prompt: 'Create a cozy fashion atelier corner featuring a vintage sewing table, dress forms, pattern paper, and warm task lighting that feels authentic yet upscale.'
      }
    ]
  },
  {
    id: 'outdoors',
    label: 'Outdoors',
    description: 'Natural and urban exterior scenes with cinematic depth.',
    presets: [
      {
        id: 'savannah_sunrise',
        label: 'Savannah Sunrise',
        description: 'Golden savannah grasses, distant acacia trees, warm dawn light.',
        prompt: 'Surround the model with a sunlit savannah at dawn, golden grasses swaying, distant acacia trees, and a warm glow that wraps the silhouette naturally.'
      },
      {
        id: 'tropical_garden',
        label: 'Tropical Garden',
        description: 'Lush palms, tropical blooms, filtered daylight, misty atmosphere.',
        prompt: 'Immerse the scene in a lush tropical garden filled with palms and flowering plants, filtered daylight, and a subtle mist that keeps focus on the apparel.'
      },
      {
        id: 'urban_promenade',
        label: 'Urban Promenade',
        description: 'Contemporary cityscape, clean architecture lines, blurred crowd.',
        prompt: 'Position the subject along a contemporary urban promenade with clean architectural lines, glass facades, and softly blurred pedestrian movement behind them.'
      }
    ]
  },
  {
    id: 'events',
    label: 'Events & Functions',
    description: 'Elevated social settings perfect for occasion wear.',
    presets: [
      {
        id: 'evening_gala',
        label: 'Evening Gala',
        description: 'Opulent ballroom, crystal chandeliers, dramatic uplighting.',
        prompt: 'Place the subject at an evening gala with crystal chandeliers, dramatic uplighting, and polished marble floors that sparkle subtly.'
      },
      {
        id: 'wedding_reception',
        label: 'Wedding Reception',
        description: 'Soft floral arrangements, candlelit tables, airy drapery.',
        prompt: 'Craft an upscale wedding reception scene with airy drapery, delicate floral arrangements, candlelit tables, and a romantic glow.'
      },
      {
        id: 'rooftop_brunch',
        label: 'Rooftop Brunch',
        description: 'Daytime city skyline, chic seating, greenery planters.',
        prompt: 'Set the subject on a chic rooftop brunch overlooking a city skyline, with modern seating, greenery planters, and bright midday ambiance.'
      }
    ]
  },
  {
    id: 'studio_editorial',
    label: 'Studio & Editorial',
    description: 'Controlled sets for bold editorial statements.',
    presets: [
      {
        id: 'white_cyclorama',
        label: 'White Cyclorama',
        description: 'Seamless white walls, polished floor, controlled edge lighting.',
        prompt: 'Stage the model on a seamless white cyclorama with polished flooring, controlled edge lighting, and soft contact shadows for a premium studio finish.'
      },
      {
        id: 'gradient_colorwash',
        label: 'Gradient Colorwash',
        description: 'Soft gradient wash, subtle haze, floating light speckles.',
        prompt: 'Paint the background with a refined gradient color wash that transitions from blush to lavender, subtle atmospheric haze, and floating light speckles for depth.'
      },
      {
        id: 'neon_cyberpunk',
        label: 'Neon Cyberpunk',
        description: 'Moody editorial alley, neon signage, glossy reflections.',
        prompt: 'Transform the backdrop into a moody editorial alley with neon signage, glossy wet reflections, and cinematic smoke for a high-fashion cyberpunk vibe.'
      }
    ]
  }
];

const CURATED_BACKGROUND_LIGHTING: BackgroundRefinementOption[] = [
  {
    id: 'soft_diffused',
    label: 'Soft Diffused',
    prompt: 'Illuminate the scene with soft, diffused lighting that flatters skin and keeps fabric textures crisp.'
  },
  {
    id: 'natural_daylight',
    label: 'Natural Daylight',
    prompt: 'Fill the environment with even natural daylight, as if from tall windows or open sky, without harsh shadows.'
  },
  {
    id: 'dramatic_spot',
    label: 'Dramatic Spotlight',
    prompt: 'Introduce directional spotlighting with tasteful falloff to sculpt the subject for editorial drama.'
  }
];

const CURATED_BACKGROUND_PALETTES: BackgroundRefinementOption[] = [
  {
    id: 'warm_neutrals',
    label: 'Warm Neutrals',
    prompt: 'Use warm neutral hues—sand, caramel, blush—to complement skin tones and fashion pieces.'
  },
  {
    id: 'cool_neutrals',
    label: 'Cool Neutrals',
    prompt: 'Keep the palette in cool neutrals—slate, charcoal, icy blue—for a sleek, modern mood.'
  },
  {
    id: 'bold_color_pop',
    label: 'Bold Color Pop',
    prompt: 'Add a bold jewel-tone color pop in the background to energize the composition without overpowering the garment.'
  }
];

const CURATED_BACKGROUND_CAMERAS: BackgroundRefinementOption[] = [
  {
    id: 'eye_level',
    label: 'Eye Level',
    prompt: 'Maintain an eye-level camera for a natural, editorial perspective that feels approachable.'
  },
  {
    id: 'slight_low',
    label: 'Slight Low Angle',
    prompt: 'Adopt a subtle low angle that lengthens the model and adds grandeur without distortion.'
  },
  {
    id: 'three_quarter',
    label: 'Three-Quarter',
    prompt: 'Compose with a three-quarter angle that reveals depth and movement while showcasing the outfit silhouette.'
  }
];

const MOOD_SCENE_PRESETS: BackgroundPreset[] = (CURATED_BACKGROUND_CATEGORIES.find((category) => category.id === 'outdoors')?.presets ?? [
  {
    id: 'savannah_sunrise',
    label: 'Savannah Sunrise',
    description: 'Golden savannah grasses, distant acacia trees, warm dawn light.',
    prompt: 'Surround the model with a sunlit savannah at dawn, golden grasses swaying, distant acacia trees, and a warm glow that wraps the silhouette naturally.'
  },
  {
    id: 'tropical_garden',
    label: 'Tropical Garden',
    description: 'Lush palms, tropical blooms, filtered daylight, misty atmosphere.',
    prompt: 'Immerse the scene in a lush tropical garden filled with palms and flowering plants, filtered daylight, and a subtle mist that keeps focus on the apparel.'
  },
  {
    id: 'urban_promenade',
    label: 'Urban Promenade',
    description: 'Contemporary cityscape, clean architecture lines, blurred crowd.',
    prompt: 'Position the subject along a contemporary urban promenade with clean architectural lines, glass facades, and softly blurred pedestrian movement behind them.'
  }
]);

const MOOD_LIGHTING_OPTIONS = CURATED_BACKGROUND_LIGHTING;
const MOOD_PALETTE_OPTIONS = CURATED_BACKGROUND_PALETTES;
const MOOD_CAMERA_OPTIONS = CURATED_BACKGROUND_CAMERAS;

const DEFAULT_MOOD_SCENE = MOOD_SCENE_PRESETS[0]?.id ?? 'savannah_sunrise';
const DEFAULT_MOOD_LIGHTING = MOOD_LIGHTING_OPTIONS[0]?.id ?? 'soft_diffused';
const DEFAULT_MOOD_PALETTE = MOOD_PALETTE_OPTIONS[0]?.id ?? 'warm_neutrals';
const DEFAULT_MOOD_CAMERA = MOOD_CAMERA_OPTIONS.find((option) => option.id === 'slight_low')?.id ?? (MOOD_CAMERA_OPTIONS[0]?.id ?? 'eye_level');

const inferTaskForEdit = (editType: string, context: ReferenceContext): PromptTask => {
  if (editType === 'apply_pose' || context === 'pose') {
    return 'pose';
  }
  if (editType.startsWith('repair_')) {
    return 'repair';
  }
  if (editType === 'remove_bg' || editType.startsWith('replace_bg')) {
    return 'background';
  }
  return 'enhancement';
};

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

export function ImageCropper({ src, onCropComplete, onClose, aspect = 3 / 4, history }: ImageCropperProps) {
  const descriptionId = useId();
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [finalCroppedImage, setFinalCroppedImage] = useState<Blob | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [storedRun, setStoredRun] = useState<StoredAiRun | null>(null);
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
  const [referenceContext, setReferenceContext] = useState<ReferenceContext>('background');
  const [solidBackgroundColor, setSolidBackgroundColor] = useState<string>('#ffffff');
  const [showSolidBackgroundTools, setShowSolidBackgroundTools] = useState(false);
  const solidBackgroundPresets = ['#FFFFFF', '#F5F5F5', '#000000', '#FCE7F3', '#FDE68A'];
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [selectedScene, setSelectedScene] = useState<string>(DEFAULT_MOOD_SCENE);
  const [selectedLighting, setSelectedLighting] = useState<string>(DEFAULT_MOOD_LIGHTING);
  const [selectedPalette, setSelectedPalette] = useState<string>(DEFAULT_MOOD_PALETTE);
  const [selectedCameraFeel, setSelectedCameraFeel] = useState<string>(DEFAULT_MOOD_CAMERA);
  const [creativeNotes, setCreativeNotes] = useState<string>('');
  const [promptPreview, setPromptPreview] = useState<string>('');
  const scenarioBackgroundConfig = useMemo(() => {
    const scenarioMap: Record<string, { editType: string; label: string }> = {
      studio: { editType: 'replace_bg_studio', label: 'Apply Studio Scene' },
      indoor: { editType: 'replace_bg_studio', label: 'Apply Indoor Scene' },
      outdoor: { editType: 'replace_bg_nature', label: 'Apply Outdoor Scene' },
      nature: { editType: 'replace_bg_nature', label: 'Apply Nature Scene' },
      beach: { editType: 'replace_bg_nature', label: 'Apply Beach Scene' },
      mountain: { editType: 'replace_bg_nature', label: 'Apply Mountain Scene' },
      urban: { editType: 'replace_bg_gradient', label: 'Apply Urban Scene' }
    };

    return scenarioMap[selectedScenario] ?? { editType: 'replace_bg_gradient', label: 'Apply Gradient Scene' };
  }, [selectedScenario]);
  const referenceCopy = useMemo(() => {
    switch (referenceContext) {
      case 'pose':
        return {
          title: 'Pose Reference',
          description: 'Upload an image that captures the desired pose. The model should be clearly visible from head to toe.'
        };
      case 'style':
        return {
          title: 'Style Reference',
          description: 'Upload an inspiration image to borrow lighting, palette, or mood from another photo.'
        };
      default:
        return {
          title: 'Background Reference',
          description: 'Upload environment images to replicate a background or scene with the AI editor.'
        };
    }
  }, [referenceContext]);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  const selectedSceneOption = useMemo(() => MOOD_SCENE_PRESETS.find((preset) => preset.id === selectedScene) ?? MOOD_SCENE_PRESETS[0], [selectedScene]);
  const selectedLightingOption = useMemo(() => MOOD_LIGHTING_OPTIONS.find((option) => option.id === selectedLighting) ?? MOOD_LIGHTING_OPTIONS[0] ?? null, [selectedLighting]);
  const selectedPaletteOption = useMemo(() => MOOD_PALETTE_OPTIONS.find((option) => option.id === selectedPalette) ?? MOOD_PALETTE_OPTIONS[0] ?? null, [selectedPalette]);
  const selectedCameraOption = useMemo(() => MOOD_CAMERA_OPTIONS.find((option) => option.id === selectedCameraFeel) ?? MOOD_CAMERA_OPTIONS[0] ?? null, [selectedCameraFeel]);

    const generateMoodPrompt = useCallback((selections: {
    scene?: BackgroundPreset | null;
    lighting?: BackgroundRefinementOption | null;
    palette?: BackgroundRefinementOption | null;
    camera?: BackgroundRefinementOption | null;
    notes?: string;
  }) => {
    const { scene, lighting, palette, camera, notes } = selections;
  
    let prompt = 'CRITICAL: Keep the fashion model, pose, face, hair, accessories, and garment EXACTLY as in the original image. Do NOT change or regenerate the subject. Replace ONLY the background behind the model with: Design a premium, photorealistic fashion background that integrates seamlessly with the preserved subject. Natural and urban exterior scenes with cinematic depth.';
  
    if (scene?.prompt) {
      prompt += ` ${scene.prompt}`;
    }
  
    if (lighting?.prompt) {
      prompt += ` ${lighting.prompt}`;
    } else if (lighting?.label) {
      prompt += ` The lighting should be ${lighting.label.toLowerCase()}.`;
    }
  
    if (palette?.prompt) {
      prompt += ` ${palette.prompt}`;
    } else if (palette?.label) {
      prompt += ` The color palette should consist of ${palette.label.toLowerCase()}.`;
    }
  
    if (camera?.prompt) {
      prompt += ` ${camera.prompt}`;
    } else if (camera?.label) {
      prompt += ` The camera angle should be a ${camera.label.toLowerCase()}.`;
    }
  
    if (notes && notes.trim().length > 0) {
      prompt += ` Also, incorporate the following creative elements: "${notes.trim()}".`;
    }
  
    prompt += ' FINAL: The model must remain fully visible, unchanged, and naturally lit in the new background—like the original photo with just the backdrop swapped.';
  
    return prompt.trim();
  }, []);
  
  useEffect(() => {
    const newPrompt = generateMoodPrompt({
      scene: selectedSceneOption,
      lighting: selectedLightingOption,
      palette: selectedPaletteOption,
      camera: selectedCameraOption,
      notes: creativeNotes
    });
    setPromptPreview(newPrompt);
  }, [creativeNotes, generateMoodPrompt, selectedCameraOption, selectedLightingOption, selectedPaletteOption, selectedSceneOption]);

  const resetMoodSelections = useCallback(() => {
    setSelectedScene(DEFAULT_MOOD_SCENE);
    setSelectedLighting(DEFAULT_MOOD_LIGHTING);
    setSelectedPalette(DEFAULT_MOOD_PALETTE);
    setSelectedCameraFeel(DEFAULT_MOOD_CAMERA);
    setCreativeNotes('');
  }, []);

  const handleGenerateMoodBackground = () => {
    if (!promptPreview.trim()) {
      return;
    }

    processAIEdit('replace_bg_curated', {
      task: 'background',
      context: 'background',
      promptDetails: {
        backgroundCategory: 'outdoors',
        backgroundPreset: selectedSceneOption?.id,
        lightingStyle: selectedLightingOption?.id,
        paletteStyle: selectedPaletteOption?.id,
        cameraAngle: selectedCameraOption?.id,
        customNotes: creativeNotes.trim() || undefined,
        curatedPrompt: promptPreview,
        curatedSource: 'mood_guidance',
        curatedSceneLabel: selectedSceneOption?.label
      }
    });

    setIsMoodModalOpen(false);
    setShowSolidBackgroundTools(false);
    setAiProcessingStatus('');
    resetMoodSelections();
  };

  const normalizedHistory = useMemo(() => {
    if (!history || history.length === 0) {
      return [];
    }

    const deduped = new Map<string, EditHistoryEntry>();
    history.forEach((entry) => {
      const key = entry.id || `${entry.previewUrl}-${entry.storedRun?.runId ?? ''}`;
      if (!deduped.has(key)) {
        deduped.set(key, entry);
      }
    });

    return Array.from(deduped.values()).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [history]);

  const revokeIfObjectUrl = useCallback((url?: string | null) => {
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.debug('Failed to revoke object URL', error);
      }
    }
  }, []);

  const applyHistoryEntry = useCallback((entry: EditHistoryEntry) => {
    if (!entry) return;

    console.log('🕑 Applying history entry', entry.id, entry);
    setSelectedHistoryId(entry.id);
    setStoredRun(entry.storedRun ?? null);

    if (objectUrl) {
      revokeIfObjectUrl(objectUrl);
      setObjectUrl(null);
    }

    setFinalCroppedImage(null);
    setProcessedImage(entry.previewUrl);
    setImageSrc(entry.previewUrl);
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, [objectUrl, revokeIfObjectUrl]);

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

  useEffect(() => {
    setSelectedHistoryId(null);
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
  const totalTools = enhancementButtons.length + effectsButtons.length + repairButtons.length + poseButtons.length + 4; // background actions
  console.log('🤖 AI Tools Section should be rendered with', totalTools, 'buttons across', 5, 'categories');
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
          setStoredRun(null);
          onCropComplete({
            blob,
            storedRun: null,
            source: 'cropped',
            previewUrl: null
          });
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
    setReferenceContext('background');
    setShowSolidBackgroundTools(false);
    setSolidBackgroundColor('#ffffff');
    setAiProcessingStatus('');
  }, [src]);

  // Handle reference image uploads
  const handleReferenceImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + referenceImages.length > 3) {
      alert('Maximum 3 reference images allowed');
      return;
    }
    setReferenceImages(prev => [...prev, ...files]);
    setAiProcessingStatus('');
  };

  // Remove reference image
  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  // AI Editing functions
  const processAIEdit = async (editType: string, options: ProcessAIEditOptions = {}) => {
    const { useReferenceImage = false, customColor, task, context, promptDetails } = options;
    const effectiveContext = context ?? referenceContext;

    console.log(`🔧 AI Edit Button Pressed: ${editType} (Reference: ${useReferenceImage})`);

    if (!imageSrc) {
      console.warn('No image source available for AI editing');
      return;
    }

    if (useReferenceImage && referenceImages.length === 0) {
      setReferenceContext(effectiveContext);
      setAiProcessingStatus(
        effectiveContext === 'pose'
          ? 'Upload a pose reference image to continue.'
          : 'Upload a reference image to continue.'
      );
      fileInputRef.current?.click();
      return;
    }

    // Cleanup previous object URL
    if (objectUrl) {
      revokeIfObjectUrl(objectUrl);
      setObjectUrl(null);
    }

    setReferenceContext(effectiveContext);

    if (editType === 'remove_bg' || editType === 'replace_bg_solid') {
      setShowSolidBackgroundTools(true);
    } else if (!editType.startsWith('replace_bg')) {
      setShowSolidBackgroundTools(false);
    }

    setStoredRun(null);
    setFinalCroppedImage(null);

    setProcessingStartTime(Date.now());
    setProcessingElapsed(0);
    setIsProcessingAI(true);
    setAiProcessingStatus('');
    try {
      console.log(`📡 Using Supabase Edge Function for Qwen API`);

      const qwenEditor = createQwenEditor('', '');

      const imageBlob = await fetch(processedImage || imageSrc).then(r => r.blob());
      console.log(`🖼️ Image blob prepared: ${imageBlob.size} bytes`);

      const normalizedColor = customColor?.trim() || undefined;
      const promptTask = task ?? inferTaskForEdit(editType, effectiveContext);
      const hasPoseReference = promptTask === 'pose' && useReferenceImage && referenceImages.length > 0;

      const editRequest = {
        image: imageBlob,
        edit_type: editType,
        reference_image: useReferenceImage && referenceImages.length > 0 ? referenceImages[0] : undefined,
        api_key: '',
        api_endpoint: '',
        promptOptions: {
          editType,
          colorStyle: selectedColor,
          shapeFormat: selectedShape,
          scenario: selectedScenario,
          customColor: normalizedColor,
          hasPoseReference,
          task: promptTask,
          backgroundCategory: promptDetails?.backgroundCategory,
          backgroundPreset: promptDetails?.backgroundPreset,
          lightingStyle: promptDetails?.lightingStyle,
          paletteStyle: promptDetails?.paletteStyle,
          cameraAngle: promptDetails?.cameraAngle,
          curatedPrompt: promptDetails?.curatedPrompt,
          customNotes: promptDetails?.customNotes
        },
        options: {
          color: selectedColor,
          shape: selectedShape,
          scenario: selectedScenario,
          colorStyle: selectedColor,
          shapeFormat: selectedShape,
          customColor: normalizedColor,
          hasPoseReference,
          task: promptTask,
          backgroundCategory: promptDetails?.backgroundCategory,
          backgroundPreset: promptDetails?.backgroundPreset,
          lightingStyle: promptDetails?.lightingStyle,
          paletteStyle: promptDetails?.paletteStyle,
          cameraAngle: promptDetails?.cameraAngle,
          curatedPrompt: promptDetails?.curatedPrompt,
          customNotes: promptDetails?.customNotes
        }
      };

      console.log(`📝 Sending request to Supabase Edge Function for ${editType}`);

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

      if (result.storedRun) {
        setStoredRun(result.storedRun);
        setProcessedImage(result.storedRun.publicUrl);
        setImageSrc(result.storedRun.publicUrl);
        setObjectUrl(null);

        // Reset crop area for the new image
        setCrop(undefined);
        setCompletedCrop(undefined);

        console.log(`🎉 Edit completed successfully - stored run ready`, result.storedRun);
      } else if (result.edited_image) {
        // Create local object URL from blob for preview and cropping
        const resultUrl = URL.createObjectURL(result.edited_image);
        setStoredRun(null);
        setProcessedImage(resultUrl);
        setImageSrc(resultUrl); // Update main image for further editing
        setObjectUrl(resultUrl); // Track for cleanup
        
        // Reset crop area for the new image
        setCrop(undefined);
        setCompletedCrop(undefined);
        
        console.log(`🎉 Edit completed successfully - local preview ready`); // Debug log
      } else if (result.imageUrl) {
        setStoredRun(null);
        setProcessedImage(result.imageUrl);
        setObjectUrl(null);
        setCrop(undefined);
        setCompletedCrop(undefined);
        console.log('🎉 Edit completed with image URL response');
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

  const enhancementButtons: AIEditButton[] = [
    { id: 'enhance_quality', label: 'Enhance Quality', icon: Sparkles, description: 'Improve sharpness & details', category: 'enhancement', task: 'enhancement' },
    { id: 'enhance_colors', label: 'Vivid Colors', icon: Palette, description: 'Make colors more vibrant', category: 'enhancement', task: 'enhancement', context: 'style' },
    { id: 'enhance_sharpness', label: 'Sharpen', icon: Zap, description: 'Increase image sharpness', category: 'enhancement', task: 'enhancement' },
    { id: 'enhance_hdr', label: 'HDR Effect', icon: Sun, description: 'High dynamic range look', category: 'enhancement', task: 'enhancement' }
  ];

  const effectsButtons: AIEditButton[] = [
    { id: 'effect_vintage', label: 'Vintage', icon: RotateCcw, description: 'Retro film look', category: 'effects', task: 'enhancement', context: 'style' },
    { id: 'effect_bw', label: 'Black & White', icon: Moon, description: 'Classic monochrome', category: 'effects', task: 'enhancement', context: 'style' },
    { id: 'effect_sepia', label: 'Sepia', icon: Sun, description: 'Warm brown tones', category: 'effects', task: 'enhancement', context: 'style' },
    { id: 'effect_cartoon', label: 'Cartoon', icon: Star, description: 'Animated cartoon style', category: 'effects', task: 'enhancement' }
  ];

  const repairButtons: AIEditButton[] = [
    { id: 'repair_limbs', label: 'Repair Limbs', icon: Brush, description: 'Fix cut-off limbs', category: 'repair', task: 'repair' }
  ];

  const poseButtons: AIEditButton[] = [
    { id: 'apply_pose', label: 'Apply Pose', icon: Layers, description: 'Match a reference pose', category: 'pose', requiresReference: true, task: 'pose', context: 'pose' }
  ];

  const triggerAIEdit = (button: AIEditButton) => {
    if (button.context) {
      setReferenceContext(button.context);
    }
    processAIEdit(button.id, {
      useReferenceImage: button.requiresReference,
      task: button.task,
      context: button.context
    });
  };

  // Cleanup useEffect
  useEffect(() => {
    return () => {
      revokeIfObjectUrl(objectUrl);
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
                setStoredRun(null);
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
    if (objectUrl) {
      revokeIfObjectUrl(objectUrl);
    }
    setCrop(undefined);
    setCompletedCrop(undefined);
    setFinalCroppedImage(null);
    setProcessedImage(null);
    setStoredRun(null);
    setReferenceImages([]);
    setSelectedColor('natural');
    setSelectedShape('original');
    setSelectedScenario('general');
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setReferenceContext('background');
    setShowSolidBackgroundTools(false);
    setSolidBackgroundColor('#ffffff');
    setAiProcessingStatus('');
    setImageSrc(src); // Restore original
    setObjectUrl(null);
  };

  const formattedProcessingTime = new Date(Math.max(processingElapsed, 0) * 1000).toISOString().substring(14, 19);
  const canSave = !isLoading && (!isProcessingAI || finalCroppedImage !== null || processedImage !== null);

  return (
    <>
      <Dialog open={!!src} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        ref={dialogContentRef}
        className="flex flex-col bg-neutral-900/60 backdrop-blur border-neutral-800 text-neutral-100 shadow-2xl"
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
{normalizedHistory.length > 0 && (
  <Card className="bg-neutral-900/70 border-neutral-800 text-neutral-100 shadow-lg">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm flex items-center gap-2 text-neutral-100">
        Previous Results
        <span className="text-xs font-normal text-neutral-400">{normalizedHistory.length}</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {normalizedHistory.map((entry) => {
          const isSelected = selectedHistoryId === entry.id;
          const thumbnail = entry.thumbnailUrl ?? entry.previewUrl;
          const statusLabel = entry.status === 'pending' ? 'Pending' : entry.status === 'uploading' ? 'Uploading' : entry.status === 'error' ? 'Error' : entry.source === 'cropped' ? 'Crop' : 'AI';
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => applyHistoryEntry(entry)}
              className={`group relative w-16 h-20 overflow-hidden rounded-lg border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                isSelected ? 'border-rose-500 shadow-lg shadow-rose-500/40' : 'border-neutral-800 hover:border-rose-400/70'
              }`}
            >
              <img
                src={thumbnail}
                alt={entry.label ?? 'AI result preview'}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1 text-[9px] tracking-tight text-white/90">
                <div className="flex items-center justify-between gap-0.5">
                  <span className="font-medium truncate">{statusLabel}</span>
                  {entry.createdAt && (
                    <span className="text-[8px] text-white/60 flex-shrink-0">{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
                {entry.label && (
                  <div className="truncate text-[8px] text-white/70 leading-tight">{entry.label}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </CardContent>
  </Card>
)}
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
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm text-neutral-100">{referenceCopy.title}</CardTitle>
                    <Select value={referenceContext} onValueChange={(value) => setReferenceContext(value as ReferenceContext)}>
                      <SelectTrigger className="h-8 w-36 bg-neutral-900 border-neutral-700 text-neutral-100 text-xs">
                        <SelectValue placeholder="Purpose" />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-900 border border-neutral-700 text-neutral-100">
                        <SelectItem value="background">Background</SelectItem>
                        <SelectItem value="pose">Pose</SelectItem>
                        <SelectItem value="style">Style</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{referenceCopy.description}</p>
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
                  <p className="text-xs text-neutral-400">Upload up to 3 reference images to guide advanced edits.</p>
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
                      <AccordionContent className="px-2 pb-3">
                        <div className="grid grid-cols-2 gap-3 p-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-20 p-2 flex flex-col items-center justify-center gap-1 text-xs min-w-0"
                            onClick={() => {
                              setReferenceContext('background');
                              setShowSolidBackgroundTools(true);
                              processAIEdit('remove_bg', { task: 'background', context: 'background' });
                            }}
                            disabled={isProcessingAI}
                          >
                            <Scissors className="w-5 h-5 flex-shrink-0" />
                            <span className="text-center leading-tight truncate max-w-full">Remove Background</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-20 p-2 flex flex-col items-center justify-center gap-1 text-xs min-w-0"
                            onClick={() => {
                              setReferenceContext('background');
                              setShowSolidBackgroundTools(false);
                              setAiProcessingStatus('');
                              resetMoodSelections();
                              setIsMoodModalOpen(true);
                            }}
                            disabled={isProcessingAI}
                          >
                            <ImageIcon className="w-5 h-5 flex-shrink-0" />
                            <span className="text-center leading-tight truncate max-w-full">Mood Background</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-20 p-2 flex flex-col items-center justify-center gap-1 text-xs min-w-0"
                            onClick={() => {
                              setReferenceContext('background');
                              setShowSolidBackgroundTools(false);
                              processAIEdit('replace_bg_transparent', { task: 'background', context: 'background' });
                            }}
                            disabled={isProcessingAI}
                          >
                            <Square className="w-5 h-5 flex-shrink-0" />
                            <span className="text-center leading-tight truncate max-w-full">Transparent PNG</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-20 p-2 flex flex-col items-center justify-center gap-1 text-xs min-w-0"
                            onClick={() => {
                              setReferenceContext('background');
                              setShowSolidBackgroundTools(false);
                              processAIEdit(scenarioBackgroundConfig.editType, { task: 'background', context: 'background' });
                            }}
                            disabled={isProcessingAI}
                          >
                            <ImageIcon className="w-5 h-5 flex-shrink-0" />
                            <span className="text-center leading-tight truncate max-w-full">{scenarioBackgroundConfig.label}</span>
                          </Button>
                        </div>

                        {showSolidBackgroundTools && (
                          <div className="mt-3 space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                            <div>
                              <p className="text-xs font-medium text-neutral-200">Solid Background Color</p>
                              <p className="text-[11px] text-neutral-400">Choose a color and apply it as a clean studio backdrop.</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <input
                                type="color"
                                value={solidBackgroundColor}
                                onChange={(event) => setSolidBackgroundColor(event.target.value)}
                                className="h-9 w-12 cursor-pointer rounded border border-neutral-700 bg-neutral-800"
                                aria-label="Solid background color"
                              />
                              <div className="font-mono text-xs text-neutral-200">{solidBackgroundColor.toUpperCase()}</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {solidBackgroundPresets.map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setSolidBackgroundColor(preset)}
                                  className={`h-6 w-6 rounded-full border ${solidBackgroundColor.toUpperCase() === preset ? 'border-rose-400 shadow-[0_0_0_2px] shadow-rose-500/40' : 'border-neutral-700'}`}
                                  style={{ backgroundColor: preset }}
                                  aria-label={`Use ${preset} background`}
                                />
                              ))}
                            </div>
                            <Button
                              size="sm"
                              className="w-full bg-rose-500 text-white hover:bg-rose-600"
                              onClick={() =>
                                processAIEdit('replace_bg_solid', {
                                  customColor: solidBackgroundColor,
                                  task: 'background',
                                  context: 'background'
                                })
                              }
                              disabled={isProcessingAI}
                            >
                              Set Solid Background
                            </Button>
                          </div>
                        )}
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
                          {enhancementButtons.map((button) => (
                            <Button
                              key={button.id}
                              variant="outline"
                              size="sm"
                              className="h-20 p-2 flex flex-col items-center justify-center gap-1 text-xs min-w-0"
                              onClick={() => triggerAIEdit(button)}
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
                          {effectsButtons.map((button) => (
                            <Button
                              key={button.id}
                              variant="outline"
                              size="sm"
                              className="h-20 p-2 flex flex-col items-center justify-center gap-1 text-xs min-w-0"
                              onClick={() => triggerAIEdit(button)}
                              disabled={isProcessingAI}
                            >
                              <button.icon className="w-5 h-5 flex-shrink-0" />
                              <span className="text-center leading-tight truncate max-w-full">{button.label}</span>
                            </Button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="pose" className="border rounded-lg">
                      <AccordionTrigger className="px-3 py-2 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          Pose
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-2 pb-2">
                        <div className="grid grid-cols-2 gap-3 p-2">
                          {poseButtons.map((button) => (
                            <Button
                              key={button.id}
                              variant="outline"
                              size="sm"
                              className="h-20 p-2 flex flex-col items-center justify-center gap-1 text-xs min-w-0"
                              onClick={() => {
                                setReferenceContext('pose');
                                if (referenceImages.length > 0) {
                                  triggerAIEdit(button);
                                } else {
                                  setAiProcessingStatus('Upload a pose reference image to continue.');
                                  fileInputRef.current?.click();
                                }
                              }}
                              disabled={isProcessingAI}
                            >
                              <button.icon className="w-5 h-5 flex-shrink-0" />
                              <span className="text-center leading-tight truncate max-w-full">{button.label}</span>
                            </Button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="repair" className="border rounded-lg">
                      <AccordionTrigger className="px-3 py-2 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Brush className="w-4 h-4" />
                          Repair
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-2 pb-2">
                        <div className="grid grid-cols-2 gap-3 p-2">
                          {repairButtons.map((button) => (
                            <Button
                              key={button.id}
                              variant="outline"
                              size="sm"
                              className="h-20 p-2 flex flex-col items-center justify-center gap-1 text-xs min-w-0"
                              onClick={() => triggerAIEdit(button)}
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
                let resultStoredRun: StoredAiRun | null = null;
                let source: 'original' | 'ai' | 'cropped' = 'original';
                let previewUrl: string | null = processedImage || imageSrc;
                
                if (finalCroppedImage) {
                  imageToSave = finalCroppedImage;
                  console.log('💾 Saving cropped image:', { size: imageToSave.size, type: imageToSave.type });
                  source = 'cropped';
                  resultStoredRun = null;
                } else if (processedImage) {
                  const response = await fetch(processedImage);
                  imageToSave = await response.blob();
                  console.log('💾 Saving AI processed image:', { size: imageToSave.size, type: imageToSave.type });
                  if (storedRun) {
                    resultStoredRun = storedRun;
                    source = 'ai';
                  }
                } else {
                  const response = await fetch(imageSrc!);
                  imageToSave = await response.blob();
                  console.log('💾 Saving original image:', { size: imageToSave.size, type: imageToSave.type });
                  if (storedRun) {
                    resultStoredRun = storedRun;
                    source = 'ai';
                  }
                }
                
                onCropComplete({
                  blob: imageToSave,
                  storedRun: resultStoredRun,
                  source,
                  previewUrl
                });
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

      <Dialog
        open={isMoodModalOpen}
        onOpenChange={(open) => {
          setIsMoodModalOpen(open);
          if (!open) {
            setAiProcessingStatus('');
            resetMoodSelections();
          }
        }}
      >
        <DialogContent className="relative max-w-4xl bg-neutral-950 border border-neutral-800 text-neutral-100 shadow-xl">
          <button
            type="button"
            onClick={() => {
              setIsMoodModalOpen(false);
              setAiProcessingStatus('');
              resetMoodSelections();
            }}
            className="absolute top-4 right-4 rounded-full p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            aria-label="Close mood guidance"
          >
            <X className="w-5 h-5" />
          </button>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Mood Guidance</DialogTitle>
            <DialogDescription className="text-sm text-neutral-300">
              Combine curated scenes, lighting, palettes, and camera feel to generate a bespoke background prompt.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-neutral-100">Scene Presets</h3>
                <p className="text-xs text-neutral-400">Pick from designer-crafted scenarios. Each one generates a unique environment.</p>
              </div>
              <div className="space-y-2">
                {MOOD_SCENE_PRESETS.map((preset) => {
                  const isSelected = preset.id === selectedScene;
                  return (
                    <Button
                      key={preset.id}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      className={`w-full justify-between gap-3 text-left h-auto py-3 px-4 ${isSelected ? 'bg-rose-500/20 border-rose-400/60 text-white hover:bg-rose-500/30' : 'bg-neutral-900/60 border-neutral-700 text-neutral-200 hover:border-rose-400/60'}`}
                      onClick={() => setSelectedScene(preset.id)}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-sm font-semibold">{preset.label}</span>
                        <span className="text-xs text-neutral-300 leading-relaxed">{preset.description}</span>
                      </div>
                      {isSelected && <span className="text-[10px] uppercase tracking-wide text-rose-300">Selected</span>}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Lighting</p>
                  <div className="flex flex-col gap-2">
                    {MOOD_LIGHTING_OPTIONS.map((option) => {
                      const isActive = option.id === selectedLighting;
                      return (
                        <Button
                          key={option.id}
                          type="button"
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          className={`justify-start ${isActive ? 'bg-sky-500/90 hover:bg-sky-500 text-white border-sky-400/60' : 'bg-neutral-900/60 border-neutral-700 text-neutral-200 hover:border-sky-400/60'}`}
                          onClick={() => setSelectedLighting(option.id)}
                        >
                          {option.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Palette</p>
                  <div className="flex flex-col gap-2">
                    {MOOD_PALETTE_OPTIONS.map((option) => {
                      const isActive = option.id === selectedPalette;
                      return (
                        <Button
                          key={option.id}
                          type="button"
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          className={`justify-start ${isActive ? 'bg-amber-500/90 hover:bg-amber-500 text-neutral-900 border-amber-400/60' : 'bg-neutral-900/60 border-neutral-700 text-neutral-200 hover:border-amber-400/60'}`}
                          onClick={() => setSelectedPalette(option.id)}
                        >
                          {option.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Camera Feel</p>
                  <div className="flex flex-col gap-2">
                    {MOOD_CAMERA_OPTIONS.map((option) => {
                      const isActive = option.id === selectedCameraFeel;
                      return (
                        <Button
                          key={option.id}
                          type="button"
                          variant={isActive ? 'default' : 'outline'}
                          size="sm"
                          className={`justify-start ${isActive ? 'bg-purple-500/90 hover:bg-purple-500 text-white border-purple-400/60' : 'bg-neutral-900/60 border-neutral-700 text-neutral-200 hover:border-purple-400/60'}`}
                          onClick={() => setSelectedCameraFeel(option.id)}
                        >
                          {option.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="mood-creative-notes" className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                  Optional Creative Notes
                </label>
                <Textarea
                  id="mood-creative-notes"
                  value={creativeNotes}
                  onChange={(event) => setCreativeNotes(event.target.value)}
                  placeholder={'Add specific props, time of day, or mood to guide the AI (e.g. "soft morning fog" or "include floating silk drapes").'}
                  className="min-h-[96px] resize-none bg-neutral-900/70 border-neutral-800 text-neutral-100 placeholder:text-neutral-500"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Prompt Preview</p>
                <Textarea
                  readOnly
                  value={promptPreview}
                  className="font-mono text-xs leading-relaxed bg-neutral-900/70 border-neutral-800 text-neutral-200 min-h-[120px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-neutral-700 text-neutral-200"
              onClick={() => {
                setIsMoodModalOpen(false);
                setAiProcessingStatus('');
                resetMoodSelections();
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-rose-500 hover:bg-rose-600 text-white"
              onClick={handleGenerateMoodBackground}
              disabled={isProcessingAI || !promptPreview.trim()}
            >
              Generate Background
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

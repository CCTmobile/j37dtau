# AI Image Editing with Local Qwen-Image

This document describes the AI-powered image editing capabilities integrated into the ImageCropper component using the local Qwen-Image-Edit model.

## ✅ Local Setup Complete - No CORS Issues

The AI editing now uses a local Python backend running the Qwen-Image-Edit model, eliminating CORS restrictions and API key requirements.

## Features

### Available AI Edits
- **Remove Background**: Automatically removes the background from images
- **Auto Background**: Generates and applies an aesthetically pleasing background  
- **Custom Background**: Uses uploaded reference images as backgrounds
- **Enhance Quality**: Improves image sharpness, color balance, and overall quality
- **Adjust Colors**: Enhances colors, contrast, and visual appeal

### Interface
- **Tabbed Interface**: Switch between "Crop" and "AI Edit" modes
- **Side Buttons**: Quick access to common AI tools in crop mode
- **Reference Images**: Upload up to 3 reference images for custom edits
- **Real-time Preview**: See AI edits applied immediately

## Backend Setup

### Prerequisites
- Python 3.10+
- NVIDIA GPU with CUDA (recommended)
- At least 8GB VRAM

### Installation
1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install PyTorch with CUDA (for GPU):**
   ```bash
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
   ```

### Running the Server
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The model will load on startup (takes 5-10 minutes first time).

## Frontend Integration

The React frontend now calls the local backend at `http://localhost:8000/edit-image`.

### Workflow
1. **Start Backend Server** (Python)
2. **Start Frontend** (`pnpm dev`)
3. **Open ImageCropper** - AI features now work locally

## API Details

### POST /edit-image
- **image**: Main image file
- **reference_image**: Optional reference for custom backgrounds
- **edit_type**: remove_bg, replace_bg_auto, replace_bg_custom, enhance, colorize
- **num_inference_steps**: 50 (default)
- **true_cfg_scale**: 4.0 (default)

**Response:** Edited PNG image stream

## Performance

- **GPU (RTX 3090)**: 30-60 seconds per edit
- **First load**: 5-10 minutes (model download + initialization)
- **Subsequent edits**: Faster due to model caching

## Troubleshooting

### Model Loading Issues
- **Out of Memory**: Use CPU mode or reduce image resolution
- **CUDA Errors**: Verify CUDA installation and GPU drivers
- **Slow Loading**: Normal for first run - model is 20B parameters

### API Errors
- **Connection Refused**: Ensure backend server is running on port 8000
- **Timeout**: Increase inference steps or use smaller images
- **Invalid Image**: Ensure uploaded images are valid PNG/JPG

### Optimization Tips
- Use 512x512 or 1024x1024 images for best balance of quality/speed
- Reduce `num_inference_steps` to 20-30 for faster previews
- Batch similar edits to reuse model state

## Model Information

- **Model**: Qwen/Qwen-Image-Edit (20B parameters)
- **License**: Apache 2.0
- **Capabilities**: Semantic editing, style transfer, object manipulation, text editing
- **Strengths**: Excellent Chinese text rendering, person consistency, product editing

## Future Enhancements

- Multi-GPU support
- Model quantization for faster inference
- Async processing queue
- Advanced prompt engineering
- ControlNet integration (poses, depth maps)

The local setup provides full control over AI editing without external dependencies or costs!
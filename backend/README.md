# Qwen Image Editing Backend

This backend provides a local API for AI image editing using the Qwen-Image-Edit model, avoiding CORS issues with cloud APIs.

## Setup

### Prerequisites
- Python 3.10+
- NVIDIA GPU with CUDA (recommended for performance)
- At least 8GB VRAM for the model

### Installation

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Install PyTorch with CUDA support (if using GPU):**
   ```bash
   # For CUDA 12.1
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
   ```

### Running the Server

1. **Start the FastAPI server:**
   ```bash
   cd backend
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **The server will load the model on startup (this may take a few minutes).**

3. **Access the API docs at:** http://localhost:8000/docs

### API Endpoints

#### POST /edit-image
- **Parameters:**
  - `image`: Main image file (PNG/JPG)
  - `reference_image`: Optional reference image for custom edits
  - `edit_type`: Type of edit (remove_bg, replace_bg_auto, replace_bg_custom, enhance, colorize)
  - `prompt`: Custom prompt (optional, defaults to edit_type specific)
  - `negative_prompt`: Negative prompt (optional)
  - `num_inference_steps`: Number of inference steps (default: 50)
  - `true_cfg_scale`: Guidance scale (default: 4.0)

- **Response:** Edited image as PNG stream

### Frontend Integration

The frontend now calls `http://localhost:8000/edit-image` instead of the cloud API.

Make sure to:
1. Start the backend server first
2. Then start the React dev server (`pnpm dev`)
3. The AI editing features should now work without CORS errors

### Troubleshooting

- **Model loading fails:** Ensure sufficient GPU memory and correct CUDA installation
- **Out of memory:** Reduce batch size or use CPU (slower)
- **Slow inference:** Use fewer inference steps or lower resolution images
- **API errors:** Check server logs for details

### Performance Notes

- First model load takes ~5-10 minutes
- Subsequent inferences: 30-60 seconds per image on RTX 3090
- CPU mode: 5-10 minutes per image (not recommended)

For production, consider:
- Model quantization for faster inference
- Multiple GPU support
- Caching common edits
- Async processing queue
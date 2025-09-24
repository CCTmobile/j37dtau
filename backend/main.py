from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import torch
from diffusers import QwenImageEditPipeline
from PIL import Image
import io
import base64
from typing import Optional
import os

app = FastAPI(title="Qwen Image Editing API")

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust for your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model on startup
model = None
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

@app.on_event("startup")
async def load_model():
    global model
    try:
        model = QwenImageEditPipeline.from_pretrained(
            "Qwen/Qwen-Image-Edit",
            torch_dtype=torch.bfloat16 if device == "cuda" else torch.float32
        )
        model = model.to(device)
        model.enable_model_cpu_offload()  # For memory efficiency
        print("Qwen Image Edit model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
        model = None

@app.post("/edit-image")
async def edit_image(
    image: UploadFile = File(...),
    reference_image: Optional[UploadFile] = File(None),
    edit_type: str = Form(...),
    prompt: str = Form(""),
    negative_prompt: str = Form(""),
    num_inference_steps: int = Form(50),
    true_cfg_scale: float = Form(4.0)
):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded. Please check server logs.")

    try:
        # Read the main image
        image_bytes = await image.read()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Prepare inputs
        inputs = {
            "image": pil_image,
            "prompt": prompt or get_prompt_for_edit_type(edit_type),
            "negative_prompt": negative_prompt,
            "num_inference_steps": num_inference_steps,
            "true_cfg_scale": true_cfg_scale,
            "generator": torch.Generator(device=device).manual_seed(42)
        }

        # Add reference image if provided
        if reference_image:
            ref_bytes = await reference_image.read()
            ref_image = Image.open(io.BytesIO(ref_bytes)).convert("RGB")
            # For now, concatenate or use as additional input if supported
            # Adjust based on model capabilities
            inputs["reference_image"] = ref_image

        # Generate edited image
        with torch.inference_mode():
            output = model(**inputs)
            edited_image = output.images[0]

        # Convert to bytes
        img_buffer = io.BytesIO()
        edited_image.save(img_buffer, format="PNG")
        img_bytes = img_buffer.getvalue()

        return StreamingResponse(
            io.BytesIO(img_bytes),
            media_type="image/png",
            headers={"Content-Disposition": "attachment; filename=edited_image.png"}
        )

    except Exception as e:
        print(f"Error during image editing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def get_prompt_for_edit_type(edit_type: str) -> str:
    prompts = {
        "remove_bg": "Remove the background from this image, keeping only the main subject with a transparent background.",
        "replace_bg_auto": "Replace the background with an aesthetically pleasing, contextually appropriate background.",
        "replace_bg_custom": "Replace the background with the reference image, ensuring seamless integration.",
        "enhance": "Enhance the image quality, improve sharpness, color balance, and overall visual appeal.",
        "colorize": "Adjust colors, improve contrast, and enhance visual quality while maintaining original style."
    }
    return prompts.get(edit_type, "Enhance this image appropriately.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

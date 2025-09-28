// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2";
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const STORAGE_BUCKET = "product-images";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});

const encoder = new TextEncoder();

function base64ToUint8Array(base64: string): Uint8Array {
  const normalized = base64.replace(/\s/g, "");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // Allow all origins (restrict in production)
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64, prompt, editType, referenceImageBase64 } = await req.json();
    const apiKey = Deno.env.get("DASHSCOPE_API_KEY"); // Store in Supabase secrets

    // Use qwen-image-edit for image editing tasks
    const model = "qwen-image-edit";
    const parameters = {}; // Empty for multimodal editing

    // Build content array for multimodal input
    const content: any[] = [
      {
        image: `data:image/jpeg;base64,${imageBase64}`
      },
      {
        text: prompt
      }
    ];

    // Add reference image if provided (for replace_bg_custom, etc.)
    if (referenceImageBase64) {
      content.push({
        image: `data:image/jpeg;base64,${referenceImageBase64}`
      });
      content.push({
        text: "Use the additional image as reference for the editing task."
      });
    }

    const response = await fetch("https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        input: {
          messages: [
            {
              role: "user",
              content: content
            }
          ]
        },
        parameters: parameters
      }),
    });

    const data = await response.json();
    console.log('Qwen API Response Status:', response.status);
    console.log('Qwen API Response Body:', JSON.stringify(data, null, 2)); // Debug log

    // 🔥 Normalize the response to match frontend expectations
    let imageUrl = null;
    if (data.output?.choices?.[0]?.message?.content) {
      const firstContent = data.output.choices[0].message.content[0];
      if (firstContent?.image) {
        imageUrl = firstContent.image;
      }
    }

    let base64Image = null;
    let mimeType = 'image/png';  // Default mime type

    if (imageUrl) {
      console.log('Fetching image from Alibaba OSS server-side:', imageUrl);
      try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image from OSS: ${imageResponse.status}`);
        }

        mimeType = imageResponse.headers.get('content-type') || 'image/png';  // Set mimeType here

        const imageBuffer = await imageResponse.arrayBuffer();
        const imageArray = new Uint8Array(imageBuffer);
        let binary = '';
        const len = imageArray.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(imageArray[i]);
        }
        base64Image = btoa(binary);

        console.log('Successfully converted image to base64');
      } catch (fetchError) {
        console.error('Error fetching/converting image:', fetchError);
        throw new Error(`Failed to process generated image: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }
    }

    let results: any[] = [];

    if (base64Image) {
      try {
        const originalBytes = base64ToUint8Array(base64Image);
        const image = await Image.decode(originalBytes);

        const runId = `ai_run_${Date.now()}_${crypto.randomUUID()}`;
        const basePath = `ai-previews/${runId}`;
        const fullPath = `${basePath}/full.webp`;
        const thumbPath = `${basePath}/thumb.webp`;

        const fullWebpBytes = await image.encodeWebp(90);
        const thumbImage = image.clone();
        thumbImage.resize(512, Image.RESIZE_AUTO);
        const thumbWebpBytes = await thumbImage.encodeWebp(75);

        const fullBlob = new Blob([fullWebpBytes], { type: "image/webp" });
        const thumbBlob = new Blob([thumbWebpBytes], { type: "image/webp" });

        const { error: fullUploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fullPath, fullBlob, {
            contentType: "image/webp",
            upsert: false
          });

        if (fullUploadError) {
          throw fullUploadError;
        }

        const { error: thumbUploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(thumbPath, thumbBlob, {
            contentType: "image/webp",
            upsert: false
          });

        if (thumbUploadError) {
          throw thumbUploadError;
        }

        const { data: fullPublic } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(fullPath);

        const { data: thumbPublic } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(thumbPath);

        results.push({
          runId,
          storagePath: fullPath,
          thumbnailPath: thumbPath,
          publicUrl: fullPublic.publicUrl,
          thumbnailUrl: thumbPublic.publicUrl,
          mimeType: "image/webp"
        });

        console.log("Stored AI result in Supabase storage", { runId, fullPath, thumbPath });
      } catch (storageError) {
        console.error("Failed to store AI result in storage, returning base64 fallback", storageError);
        results.push({ imageData: `data:${mimeType};base64,${base64Image}` });
      }
    }

    const normalizedResponse = {
      output: {
        results
      },
      usage: data.usage,
      request_id: data.request_id
    };

    console.log('Returning normalized response with', results.length, 'result item(s)');

    return new Response(JSON.stringify(normalizedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
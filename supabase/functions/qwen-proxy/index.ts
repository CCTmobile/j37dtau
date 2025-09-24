import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Return JSON with base64 data URL
    const normalizedResponse = {
      output: {
        results: base64Image ? [{ imageData: `data:${mimeType};base64,${base64Image}` }] : []
      },
      usage: data.usage,
      request_id: data.request_id
    };

    console.log('Returning normalized response with base64 image data');

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
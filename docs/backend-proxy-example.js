// Example backend API route for Qwen AI image editing
// This can be implemented in Next.js, Express, or any backend framework

// For Next.js API routes (/pages/api/ai-edit.ts or /app/api/ai-edit/route.ts)
import { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, editType, referenceImage, apiKey } = req.body;

    if (!image || !editType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get API key from environment or request
    const qwenApiKey = apiKey || process.env.QWEN_API_KEY;
    if (!qwenApiKey) {
      return res.status(500).json({ error: 'Qwen API key not configured' });
    }

    // Convert base64 image to the format expected by Qwen API
    const imageData = image.replace(/^data:image\/[a-z]+;base64,/, '');

    // Prepare the request for Qwen API
    const qwenRequest = {
      model: "qwen-vl-max",
      input: {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: getPromptForEditType(editType)
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${imageData}`
                }
              }
            ].concat(referenceImage ? [{
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${referenceImage}`
              }
            }] : [])
          }
        ]
      },
      parameters: {
        temperature: 0.1,
        max_tokens: 1000
      }
    };

    // Call Qwen API
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${qwenApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(qwenRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Qwen API error:', errorText);
      return res.status(response.status).json({ error: 'AI processing failed' });
    }

    const result = await response.json();

    // Process the response and return the edited image
    // Note: The exact response format depends on Qwen API
    if (result.output && result.output.choices && result.output.choices[0]) {
      const editedImageUrl = result.output.choices[0].message.content;

      // If the response contains an image URL, fetch it
      if (editedImageUrl && editedImageUrl.startsWith('http')) {
        const imageResponse = await fetch(editedImageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();

        res.setHeader('Content-Type', 'image/png');
        res.send(Buffer.from(imageBuffer));
      } else {
        res.status(200).json({ result: editedImageUrl });
      }
    } else {
      res.status(500).json({ error: 'Invalid response from Qwen API' });
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function getPromptForEditType(editType: string): string {
  switch (editType) {
    case 'remove_bg':
      return 'Remove the background from this image, keeping only the main subject with a transparent background. Return the edited image.';
    case 'replace_bg_auto':
      return 'Replace the background of this image with an aesthetically pleasing, contextually appropriate background that complements the main subject. Return the edited image.';
    case 'replace_bg_custom':
      return 'Replace the background of the first image with the second image as reference, ensuring seamless integration and natural appearance. Return the edited image.';
    case 'enhance':
      return 'Enhance the image quality by improving sharpness, color balance, contrast, and overall visual appeal. Return the edited image.';
    case 'colorize':
      return 'Adjust the colors, improve contrast, and enhance the visual quality of the image while maintaining the original style. Return the edited image.';
    default:
      return 'Enhance this image appropriately and return the edited image.';
  }
}

// For Express.js implementation:
/*
const express = require('express');
const router = express.Router();

router.post('/ai-edit', async (req, res) => {
  // Same logic as above
});

module.exports = router;
*/
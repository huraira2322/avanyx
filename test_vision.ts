import 'dotenv/config';
import { routeAIRequest } from './src/server/aiRouter.js';

async function testImage() {
  console.log('Fetching an image...');
  const response = await fetch('https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80'); // A red Nike shoe
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  
  console.log('Image fetched. Sending to Avanyx AI Router...');
  const aiResult = await routeAIRequest({
    engineId: 'flash-omni-1',
    messages: [
      {
        role: 'user',
        content: 'What is in this image? Describe the main object and its color.',
      }
    ],
    images: [{
      mimeType: 'image/jpeg',
      data: base64,
      name: 'test_image.jpg'
    }],
    maxTokens: 500,
  });

  console.log('\n--- AI RESPONSE ---');
  console.log(JSON.stringify(aiResult, null, 2));
}

testImage().catch(console.error);

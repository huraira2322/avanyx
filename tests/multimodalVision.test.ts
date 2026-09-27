import { describe, it, expect, vi, beforeEach } from 'vitest';
import { routeAIRequest, NormalizedRequest } from '../src/server/aiRouter';
import * as geminiTextService from '../src/server/geminiTextService';
import * as deepSeekService from '../src/server/deepSeekService';

describe('Multimodal Vision Routing Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('routes text-only queries to primary DeepSeek engine when available', async () => {
    vi.spyOn(deepSeekService, 'isDeepSeekConfigured').mockReturnValue(true);
    const deepSeekSpy = vi.spyOn(deepSeekService, 'generateWithRetry').mockResolvedValue({
      text: 'DeepSeek text analysis',
      modelUsed: 'deepseek-v4-pro',
      tokensUsed: 30,
      finishReason: 'stop',
    });

    const request: NormalizedRequest = {
      engineId: 'avanyx-omni',
      messages: [{ role: 'user', content: 'What is our profit margin?' }],
      maxTokens: 1024,
    };

    const result = await routeAIRequest(request);

    expect(result.success).toBe(true);
    expect(result.content).toBe('DeepSeek text analysis');
    expect(result.provider).toBe('deepseek');
    expect(deepSeekSpy).toHaveBeenCalled();
  });

  it('automatically routes requests with single image attachment to Gemini multimodal vision model', async () => {
    vi.spyOn(geminiTextService, 'isGeminiTextConfigured').mockReturnValue(true);
    const geminiSpy = vi.spyOn(geminiTextService, 'generateGeminiText').mockResolvedValue({
      text: 'Analyzed invoice: Vendor Acme Corp, Total: $1,450.00',
      modelUsed: 'gemini-2.5-flash',
      tokensUsed: 200,
      finishReason: 'stop',
    });

    const request: NormalizedRequest = {
      engineId: 'avanyx-omni',
      messages: [{ role: 'user', content: 'Extract details from this invoice receipt' }],
      images: [
        {
          mimeType: 'image/png',
          data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          name: 'receipt.png',
        },
      ],
      maxTokens: 1024,
    };

    const result = await routeAIRequest(request);

    expect(result.success).toBe(true);
    expect(result.content).toContain('Analyzed invoice: Vendor Acme Corp');
    expect(result.provider).toBe('gemini');
    expect(geminiSpy).toHaveBeenCalledTimes(1);

    // Verify image was passed to Gemini with inlineData
    const passedMessages = geminiSpy.mock.calls[0][1];
    const userMessage = passedMessages.find(m => m.role === 'user');
    expect(userMessage?.images).toBeDefined();
    expect(userMessage?.images?.length).toBe(1);
    expect(userMessage?.images?.[0].mimeType).toBe('image/png');
  });

  it('handles multiple images in multimodal queries without losing attachments', async () => {
    vi.spyOn(geminiTextService, 'isGeminiTextConfigured').mockReturnValue(true);
    const geminiSpy = vi.spyOn(geminiTextService, 'generateGeminiText').mockResolvedValue({
      text: 'Compared Image 1 (Product A) and Image 2 (Product B). Product A is in stock.',
      modelUsed: 'gemini-2.5-flash',
      tokensUsed: 380,
      finishReason: 'stop',
    });

    const request: NormalizedRequest = {
      engineId: 'avanyx-omni',
      messages: [{ role: 'user', content: 'Compare these two products' }],
      images: [
        { mimeType: 'image/jpeg', data: 'base64Data1', name: 'product1.jpg' },
        { mimeType: 'image/jpeg', data: 'base64Data2', name: 'product2.jpg' },
      ],
      maxTokens: 2048,
    };

    const result = await routeAIRequest(request);

    expect(result.success).toBe(true);
    expect(result.provider).toBe('gemini');
    expect(geminiSpy).toHaveBeenCalledTimes(1);

    const passedMessages = geminiSpy.mock.calls[0][1];
    const userMessage = passedMessages.find(m => m.role === 'user');
    expect(userMessage?.images?.length).toBe(2);
  });

  it('preserves multi-turn conversation context and previous image references in history', async () => {
    vi.spyOn(geminiTextService, 'isGeminiTextConfigured').mockReturnValue(true);
    const geminiSpy = vi.spyOn(geminiTextService, 'generateGeminiText').mockResolvedValue({
      text: 'Step 3 in the screenshot shows that the API port 3000 is occupied by another process.',
      modelUsed: 'gemini-2.5-flash',
      tokensUsed: 190,
      finishReason: 'stop',
    });

    const request: NormalizedRequest = {
      engineId: 'avanyx-chat',
      messages: [
        {
          role: 'user',
          content: 'Here is an error screenshot.',
          images: [{ mimeType: 'image/png', data: 'errorScreenshotBase64', name: 'error.png' }],
        },
        {
          role: 'assistant',
          content: 'I see an EADDRINUSE error on port 3000.',
        },
        {
          role: 'user',
          content: 'Can you explain step 3 in detail?',
        },
      ],
      maxTokens: 1024,
    };

    const result = await routeAIRequest(request);

    expect(result.success).toBe(true);
    expect(result.provider).toBe('gemini');
    expect(geminiSpy).toHaveBeenCalledTimes(1);

    const passedMessages = geminiSpy.mock.calls[0][1];
    expect(passedMessages.length).toBe(3);
    // Verify first user message retains the image attachment
    expect(passedMessages[0].images?.length).toBe(1);
    expect(passedMessages[0].images?.[0].data).toBe('errorScreenshotBase64');
  });

  it('answers specific product categorization questions about uploaded product images', async () => {
    vi.spyOn(geminiTextService, 'isGeminiTextConfigured').mockReturnValue(true);
    const geminiSpy = vi.spyOn(geminiTextService, 'generateGeminiText').mockResolvedValue({
      text: 'This is a Silk Blend Tailored Blazer in Navy Blue. Recommended category: Apparel > Outerwear > Blazers. Suggested SKU: BLZ-NAV-01.',
      modelUsed: 'gemini-2.5-flash',
      tokensUsed: 120,
      finishReason: 'stop',
    });

    const request: NormalizedRequest = {
      engineId: 'avanyx-chat',
      messages: [
        {
          role: 'user',
          content: 'What is this and what category should I put it in?',
          images: [{ mimeType: 'image/jpeg', data: 'blazerBase64Data', name: 'product.jpg' }],
        },
      ],
      maxTokens: 1024,
    };

    const result = await routeAIRequest(request);

    expect(result.success).toBe(true);
    expect(result.content).toContain('Silk Blend Tailored Blazer');
    expect(result.content).toContain('Apparel > Outerwear > Blazers');
    expect(result.provider).toBe('gemini');
  });

  it('returns clean descriptive error if Gemini is not configured for image analysis', async () => {
    vi.spyOn(geminiTextService, 'isGeminiTextConfigured').mockReturnValue(false);

    const request: NormalizedRequest = {
      engineId: 'avanyx-omni',
      messages: [{ role: 'user', content: 'Analyze this receipt' }],
      images: [{ mimeType: 'image/png', data: 'receiptData', name: 'receipt.png' }],
      maxTokens: 1024,
    };

    const result = await routeAIRequest(request);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Multimodal image analysis requires Google Gemini API key');
  });
});
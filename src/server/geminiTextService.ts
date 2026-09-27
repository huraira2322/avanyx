/**
 * Avanyx Gemini Text Service
 * Handles text generation using Google Gemini as the backup provider.
 * Separate from the GoogleGenAI SDK used for image/video generation.
 */
import { GoogleGenAI } from '@google/genai';

export type GeminiModelId =
  | 'gemini-3.5-flash'
  | 'gemini-3.1-pro-preview'
  | 'gemini-2.5-flash'
  | 'gemini-2.0-flash'
  | 'gemini-1.5-flash'
  | 'gemini-1.5-pro'
  | 'gemini-flash-lite-latest'
  | string;

export interface GeminiImagePart {
  mimeType: string;
  data: string;
  name?: string;
}

export interface GeminiMessage {
  role: 'user' | 'assistant';
  content: string;
  images?: GeminiImagePart[];
}

export interface GeminiResult {
  text: string;
  modelUsed: GeminiModelId;
  tokensUsed: number;
  finishReason: string;
}

export class GeminiError extends Error {
  status: number;
  isRetryable: boolean;
  isRateLimit: boolean;
  constructor(message: string, status: number, opts?: { isRetryable?: boolean; isRateLimit?: boolean }) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
    this.isRetryable = opts?.isRetryable ?? false;
    this.isRateLimit = opts?.isRateLimit ?? false;
  }
}

// ─── API Key ─────────────────────────────────────────────────────────────────

let cachedKey: string | null | undefined = undefined;

export function getGeminiTextApiKey(): string | null {
  if (cachedKey !== undefined) return cachedKey;
  const key = process.env.GEMINI_API_KEY || '';
  if (!key || typeof key !== 'string' || key.trim() === '' || key.startsWith('ENTER_') || key.length < 10) {
    cachedKey = null;
    return null;
  }
  cachedKey = key.trim();
  return cachedKey;
}

export function isGeminiTextConfigured(): boolean {
  return getGeminiTextApiKey() !== null;
}

// ─── Model Config ────────────────────────────────────────────────────────────

export const GEMINI_TEXT_MODELS: Record<string, { label: string; supportsThinking: boolean }> = {
  'gemini-3.5-flash': { label: 'Gemini 3.5 Flash', supportsThinking: true },
  'gemini-3.1-pro-preview': { label: 'Gemini 3.1 Pro (Deep Vision & Reasoning)', supportsThinking: true },
  'gemini-2.5-flash': { label: 'Gemini 2.5 Flash (Multimodal Vision)', supportsThinking: true },
  'gemini-2.0-flash': { label: 'Gemini 2.0 Flash (Fast Multimodal)', supportsThinking: true },
  'gemini-1.5-flash': { label: 'Gemini 1.5 Flash (Multimodal)', supportsThinking: false },
  'gemini-1.5-pro': { label: 'Gemini 1.5 Pro (Multimodal)', supportsThinking: false },
  'gemini-flash-lite-latest': { label: 'Gemini Flash-Lite (latest)', supportsThinking: false },
};

/** Preferred model cascade for multimodal vision */
export const VISION_MODEL_FALLBACKS: GeminiModelId[] = [
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-3.1-pro-preview',
];

// ─── Client ──────────────────────────────────────────────────────────────────

let geminiTextClient: GoogleGenAI | null = null;

function getGeminiTextClient(): GoogleGenAI | null {
  if (geminiTextClient) return geminiTextClient;
  const key = getGeminiTextApiKey();
  if (!key) return null;
  geminiTextClient = new GoogleGenAI({ apiKey: key });
  return geminiTextClient;
}

// ─── Helper: Normalize MIME Type ─────────────────────────────────────────────

function normalizeMimeType(mime: string): string {
  const clean = (mime || '').toLowerCase().trim();
  if (clean.includes('png')) return 'image/png';
  if (clean.includes('jpeg') || clean.includes('jpg')) return 'image/jpeg';
  if (clean.includes('webp')) return 'image/webp';
  if (clean.includes('gif')) return 'image/gif';
  if (clean.includes('heic')) return 'image/heic';
  if (clean.includes('heif')) return 'image/heif';
  if (clean.includes('pdf')) return 'application/pdf';
  return clean || 'image/jpeg';
}

// ─── API Call ────────────────────────────────────────────────────────────────

async function callGeminiText(
  modelId: GeminiModelId,
  messages: GeminiMessage[],
  opts?: { systemInstruction?: string; temperature?: number; maxTokens?: number; thinking?: boolean; timeoutMs?: number }
): Promise<GeminiResult> {
  const client = getGeminiTextClient();
  if (!client) throw new GeminiError('GEMINI_API_KEY is not configured.', 401, { isRetryable: false });

  // Map requested model to a verified GenAI model name if legacy or alias
  let targetModel = modelId;
  if (targetModel === 'gemini-3.5-flash') {
    targetModel = 'gemini-2.5-flash';
  }

  // Convert messages to Gemini contents format with real multimodal image support
  const contents = messages.map((m) => {
    const role = m.role === 'assistant' ? 'model' : 'user';
    const parts: any[] = [];
    if (m.images && Array.isArray(m.images) && m.images.length > 0) {
      m.images.forEach((img) => {
        if (img && img.data) {
          const cleanData = img.data.replace(/^data:.*?;base64,/, '').trim();
          const mimeType = normalizeMimeType(img.mimeType);
          if (cleanData) {
            parts.push({
              inlineData: {
                mimeType,
                data: cleanData,
              },
            });
          }
        }
      });
    }
    if (m.content) {
      parts.push({ text: m.content });
    } else if (parts.length > 0) {
      // If user provided image without text, give standard detailed analysis directive
      parts.push({ text: 'Analyze the attached image(s) in detail and answer any user questions or extract all key objects, text, receipts, products, or errors.' });
    } else {
      parts.push({ text: '' });
    }
    return { role, parts };
  });

  const controller = new AbortController();
  const timeoutMs = opts?.timeoutMs || 60000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response: any = await Promise.race([
      client.models.generateContent({
        model: targetModel,
        contents,
        config: {
          systemInstruction: opts?.systemInstruction,
          temperature: opts?.temperature,
          maxOutputTokens: opts?.maxTokens,
          abortSignal: controller.signal,
        },
      }),
      new Promise((_resolve, reject) =>
        setTimeout(
          () => reject(new GeminiError(`Gemini request timed out after ${timeoutMs}ms`, 408, { isRetryable: true })),
          timeoutMs
        )
      ),
    ]);
    clearTimeout(timeoutId);

    let text = '';
    if (typeof response?.text === 'string') {
      text = response.text;
    } else if (typeof response?.text === 'function') {
      try { text = response.text(); } catch (_) {}
    } else if (response?.candidates?.[0]?.content?.parts) {
      text = response.candidates[0].content.parts.map((p: any) => p.text || '').join('');
    } else if (response?.[0]?.text) {
      text = response[0].text;
    }

    return {
      text: typeof text === 'string' ? text : '',
      modelUsed: targetModel,
      tokensUsed: response?.usageMetadata?.totalTokenCount || 0,
      finishReason: 'stop',
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      throw new GeminiError(`Gemini request timed out after ${timeoutMs}ms`, 408, { isRetryable: true });
    }
    const status = err?.status || 500;
    const isRateLimit = status === 429;
    const isRetryable = isRateLimit || status >= 500 || status === 408;
    throw new GeminiError(err?.message || 'Gemini request failed', status, { isRetryable, isRateLimit });
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function generateGeminiText(
  modelId: GeminiModelId,
  messages: GeminiMessage[],
  opts?: { systemInstruction?: string; temperature?: number; maxTokens?: number; thinking?: boolean; timeoutMs?: number; maxRetries?: number }
): Promise<GeminiResult> {
  const maxRetries = opts?.maxRetries ?? 2;
  let lastErr: GeminiError | null = null;

  // Primary model attempts
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callGeminiText(modelId, messages, opts);
    } catch (err) {
      lastErr = err instanceof GeminiError ? err : new GeminiError(String(err), 500);
      if (lastErr.status === 401) throw lastErr;
      
      // If 404 (model not found) or unretryable, try next fallback vision model in cascade
      if (lastErr.status === 404 || !lastErr.isRetryable) {
        break;
      }
      if (attempt >= maxRetries) break;
      const delay = lastErr.isRateLimit ? 2000 * (attempt + 1) : 500 * (attempt + 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  // If primary model failed, try fallback vision models in cascade
  const hasImages = messages.some((m) => m.images && m.images.length > 0);
  const cascadeCandidates = hasImages ? VISION_MODEL_FALLBACKS : ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-lite-latest'];

  for (const fallbackModel of cascadeCandidates) {
    if (fallbackModel === modelId) continue;
    try {
      console.info(`[Gemini Service] Trying fallback vision model: ${fallbackModel}`);
      return await callGeminiText(fallbackModel, messages, { ...opts, maxTokens: opts?.maxTokens || 4096 });
    } catch (fallbackErr: any) {
      lastErr = fallbackErr instanceof GeminiError ? fallbackErr : new GeminiError(String(fallbackErr), 500);
      if (lastErr.status === 401) throw lastErr;
    }
  }

  throw lastErr || new GeminiError('Gemini request failed after retries and model cascade.', 500);
}

export async function checkGeminiTextHealth(): Promise<{ ok: boolean; model: GeminiModelId; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    await callGeminiText('gemini-2.5-flash', [{ role: 'user', content: 'ping' }], { maxTokens: 16, timeoutMs: 15000 });
    return { ok: true, model: 'gemini-2.5-flash', latencyMs: Date.now() - start };
  } catch (err: any) {
    return { ok: false, model: 'gemini-2.5-flash', latencyMs: Date.now() - start, error: err?.message };
  }
}
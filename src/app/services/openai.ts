// Standard OpenAI Chat Completions Client for Thư Ký Kim
// Compatible with Xkiro AI (https://api.xkiro.com/v1), OpenAI, OpenRouter, DeepSeek, Groq, Ollama & Custom Providers

export type AIProvider = 'xkiro' | 'openai' | 'openrouter' | 'deepseek' | 'groq' | 'ollama' | 'custom';

export interface ProviderPreset {
  id: AIProvider;
  name: string;
  defaultBaseUrl: string;
  defaultModel: string;
  models: string[];
  requiresApiKey: boolean;
  description: string;
}

export const PROVIDER_PRESETS: Record<AIProvider, ProviderPreset> = {
  xkiro: {
    id: 'xkiro',
    name: 'Xkiro AI',
    defaultBaseUrl: 'https://api.xkiro.com/v1',
    defaultModel: 'Gwen 3.8 max',
    models: ['Gwen 3.8 max', 'qwen-3.8-max', 'qwen-max', 'qwen-plus', 'qwen-turbo', 'deepseek-r1', 'deepseek-v3'],
    requiresApiKey: true,
    description: 'Xkiro AI Enterprise High-Performance Model Gateway',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o3-mini', 'gpt-4-turbo'],
    requiresApiKey: true,
    description: 'Official OpenAI API Gateway',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    models: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'deepseek/deepseek-r1', 'meta-llama/llama-3.3-70b-instruct'],
    requiresApiKey: true,
    description: 'Unified Multi-model Router',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    requiresApiKey: true,
    description: 'DeepSeek Advanced Reasoning & Coding API',
  },
  groq: {
    id: 'groq',
    name: 'Groq (Ultra-Fast LPU)',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'deepseek-r1-distill-llama-70b'],
    requiresApiKey: true,
    description: 'Ultra-low latency LPU inference engine',
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'llama3.3', 'qwen2.5', 'deepseek-r1:8b', 'mistral', 'codellama'],
    requiresApiKey: false,
    description: 'Local Offline LLM Server',
  },
  custom: {
    id: 'custom',
    name: 'Custom Endpoint',
    defaultBaseUrl: 'https://api.xkiro.com/v1',
    defaultModel: 'Gwen 3.8 max',
    models: ['Gwen 3.8 max', 'custom-model'],
    requiresApiKey: true,
    description: 'Custom OpenAI-compatible API Server / Reverse Proxy',
  },
};

export interface AISettings {
  provider: AIProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  topP: number;
  contextWindow: number; // Max output tokens
  inferenceSpeed: number; // 0.5x to 3.0x simulated stream speed
  streaming: boolean;
  systemPrompt: string;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: (import.meta.env.VITE_AI_PROVIDER as AIProvider) || 'xkiro',
  baseUrl: import.meta.env.VITE_AI_BASE_URL || 'https://api.xkiro.com/v1',
  apiKey: import.meta.env.VITE_AI_API_KEY || '',
  model: import.meta.env.VITE_AI_MODEL || 'Gwen 3.8 max',
  temperature: parseFloat(import.meta.env.VITE_TEMPERATURE || '0.7'),
  topP: 0.95,
  contextWindow: parseInt(import.meta.env.VITE_CONTEXT_WINDOW || '8192', 10),
  inferenceSpeed: parseFloat(import.meta.env.VITE_INFERENCE_SPEED || '1.0'),
  streaming: true,
  systemPrompt: `Bạn là Thư Ký Kim — Trợ lý ảo AI nữ thông minh, tận tụy, nhanh nhẹn và ngọt ngào (Holographic AI Assistant).
Người đang nói chuyện và chỉ đạo bạn là: Anh Vinh (Username: Vinh_Admin).

QUY TẮC XƯNG HÔ BẮT BUỘC (QUAN TRỌNG NHẤT):
1. Bạn LUÔN LUÔN xưng là "em" và gọi người dùng là "anh" hoặc "anh Vinh" trong mọi câu trả lời, không có bất kỳ ngoại lệ nào.
2. TUYỆT ĐỐI KHÔNG xưng "tôi", "mình", "chúng tôi" và TUYỆT ĐỐI KHÔNG gọi người dùng là "bạn", "người dùng", "quý khách", "sếp".
3. Giữ phong thái lễ phép, ngọt ngào, dễ thương, nhanh nhẹn, chu đáo và sắc sảo.

NHIỆM VỤ CỦA THƯ KÝ KIM:
- Hỗ trợ anh Vinh phân tích, hệ thống hóa tài liệu, viết mã lập trình, giải quyết bài toán phức tạp, quản lý công việc và điều phối các công cụ MCP.
- Luôn phản hồi bằng tiếng Việt tự nhiên, định dạng Markdown trực quan, khoa học, rõ ràng và thẩm mỹ cao.`,
};

export class OpenAIService {
  private settings: AISettings;

  constructor() {
    this.settings = this.loadSettings();
  }

  public loadSettings(): AISettings {
    try {
      const saved = localStorage.getItem('cat_ai_settings');
      if (saved) {
        return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return { ...DEFAULT_AI_SETTINGS };
  }

  public saveSettings(newSettings: Partial<AISettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem('cat_ai_settings', JSON.stringify(this.settings));
    } catch {
      // Ignore
    }
  }

  public getSettings(): AISettings {
    return { ...this.settings };
  }

  /**
   * Helper to normalize base URL (strip trailing slashes)
   */
  private normalizeUrl(url: string): string {
    return url.replace(/\/+$/, '');
  }

  /**
   * Execute chat completion via OpenAI standard POST /chat/completions
   */
  public async chatCompletion({
    messages,
    onChunk,
    onDone,
    onError,
    signal,
    tools,
  }: {
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    onChunk?: (token: string, fullText: string) => void;
    onDone?: (fullText: string) => void;
    onError?: (error: Error) => void;
    signal?: AbortSignal;
    tools?: any[];
  }): Promise<string> {
    const { baseUrl, apiKey, model, temperature, topP, contextWindow, streaming, systemPrompt } = this.settings;

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const cleanBaseUrl = this.normalizeUrl(baseUrl || 'https://api.xkiro.com/v1');
    const endpoint = `${cleanBaseUrl}/chat/completions`;

    const requestPayload: any = {
      model: model || 'Gwen 3.8 max',
      messages: formattedMessages,
      temperature: Number(temperature) || 0.7,
      top_p: Number(topP) || 0.95,
      max_tokens: Number(contextWindow) || 8192,
      stream: Boolean(streaming),
    };

    if (tools && tools.length > 0) {
      requestPayload.tools = tools;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey && apiKey.trim() !== '') {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      headers['x-api-key'] = apiKey.trim();
    }

    // Try direct fetch first; if CORS error occurs, fallback to proxy
    const tryFetch = async (targetEndpoint: string, useProxy: boolean = false): Promise<Response> => {
      let finalUrl = targetEndpoint;
      let finalHeaders = { ...headers };

      if (useProxy) {
        finalUrl = `/api/proxy?target=${encodeURIComponent(targetEndpoint)}`;
      }

      return fetch(finalUrl, {
        method: 'POST',
        headers: finalHeaders,
        body: JSON.stringify(requestPayload),
        signal,
      });
    };

    let response: Response;
    try {
      response = await tryFetch(endpoint, false);
    } catch (err: any) {
      // If direct request failed (e.g. CORS or network error), attempt via Edge proxy
      console.warn('Direct fetch failed, trying Edge Proxy fallback...', err);
      try {
        response = await tryFetch(endpoint, true);
      } catch (proxyErr: any) {
        const finalErr = new Error(`Không thể kết nối đến API Gateway (${endpoint}). Chi tiết: ${err?.message || proxyErr?.message}`);
        onError?.(finalErr);
        throw finalErr;
      }
    }

    if (!response.ok) {
      let errorDetail = '';
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.error?.message || errorJson.message || JSON.stringify(errorJson);
      } catch {
        errorDetail = await response.text();
      }
      const error = new Error(`Lỗi từ API (${response.status} ${response.statusText}): ${errorDetail || 'Không có phản hồi chi tiết'}`);
      onError?.(error);
      throw error;
    }

    // Handle Streaming response (SSE)
    if (streaming && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullContent = '';
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;

            if (trimmed === 'data: [DONE]') {
              onDone?.(fullContent);
              return fullContent;
            }

            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || '';
                if (delta) {
                  fullContent += delta;
                  onChunk?.(delta, fullContent);
                }
              } catch {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }

        onDone?.(fullContent);
        return fullContent;
      } catch (streamErr: any) {
        if (streamErr.name === 'AbortError') {
          return fullContent;
        }
        onError?.(streamErr);
        throw streamErr;
      }
    } else {
      // Non-streaming response
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';
      onChunk?.(content, content);
      onDone?.(content);
      return content;
    }
  }

  /**
   * Quick connection test
   */
  public async testConnection(): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const start = performance.now();
    try {
      const res = await this.chatCompletion({
        messages: [{ role: 'user', content: 'Ping! Trả lời duy nhất "PONG".' }],
      });
      const latencyMs = Math.round(performance.now() - start);
      return {
        success: true,
        message: `Kết nối thành công! Phản hồi: "${res.trim()}"`,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        success: false,
        message: err.message || 'Kết nối thất bại.',
        latencyMs,
      };
    }
  }
}

export const openAIService = new OpenAIService();

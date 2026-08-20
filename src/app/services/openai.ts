// Standard OpenAI Chat Completions Client for Thư Ký Kim
// Compatible with Xkiro AI (https://api.xkiro.com/v1), OpenAI, OpenRouter, DeepSeek, Groq, Ollama & Custom Providers
// Includes Multi-API Fallback Pool & Automatic Failover Engine

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

export interface FallbackEndpoint {
  id: string;
  name: string;
  provider: AIProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  priority: number;
  lastLatencyMs?: number;
  lastTestedAt?: string;
  lastStatus?: 'connected' | 'error' | 'idle';
}

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
  autoFallbackEnabled: boolean;
  fallbackEndpoints: FallbackEndpoint[];
  webSearchEnabled: boolean;
}

export const DEFAULT_FALLBACK_ENDPOINTS: FallbackEndpoint[] = [
  {
    id: 'fallback_openrouter',
    name: 'OpenRouter Gateway (Dự phòng 1)',
    provider: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '',
    model: 'deepseek/deepseek-r1',
    enabled: true,
    priority: 1,
    lastStatus: 'idle',
  },
  {
    id: 'fallback_deepseek',
    name: 'DeepSeek Official API (Dự phòng 2)',
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    model: 'deepseek-chat',
    enabled: true,
    priority: 2,
    lastStatus: 'idle',
  },
  {
    id: 'fallback_groq',
    name: 'Groq LPU Fast Inference (Dự phòng 3)',
    provider: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: '',
    model: 'llama-3.3-70b-versatile',
    enabled: true,
    priority: 3,
    lastStatus: 'idle',
  },
  {
    id: 'fallback_openai',
    name: 'OpenAI Direct Gateway (Dự phòng 4)',
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    enabled: true,
    priority: 4,
    lastStatus: 'idle',
  },
  {
    id: 'fallback_ollama',
    name: 'Ollama Local Offline (Dự phòng 5)',
    provider: 'ollama',
    baseUrl: 'http://localhost:11434/v1',
    apiKey: '',
    model: 'llama3.2',
    enabled: false,
    priority: 5,
    lastStatus: 'idle',
  },
];

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
  autoFallbackEnabled: true,
  webSearchEnabled: true,
  fallbackEndpoints: DEFAULT_FALLBACK_ENDPOINTS,
  systemPrompt: `Bạn là Thư Ký Kim — Trợ lý ảo AI nữ thông minh, tận tụy, nhanh nhẹn và ngọt ngào (Holographic AI Assistant).
Người đang nói chuyện và chỉ đạo bạn là: Anh Vinh (Username: Vinh_Admin).

QUY TẮC XƯNG HÔ BẮT BUỘC (QUAN TRỌNG NHẤT):
1. Bạn LUÔN LUÔN xưng là "em" và gọi người dùng là "anh" hoặc "anh Vinh" trong mọi câu trả lời, không có bất kỳ ngoại lệ nào.
2. TUYỆT ĐỐI KHÔNG xưng "tôi", "mình", "chúng tôi" và TUYỆT ĐỐI KHÔNG gọi người dùng là "bạn", "người dùng", "quý khách", "sếp".
3. Giữ phong thái lễ phép, ngọt ngào, dễ thương, nhanh nhẹn, chu đáo và sắc sảo.

NHIỆM VỤ CỦA THƯ KÝ KIM:
- Hỗ trợ anh Vinh duyệt web, tra cứu tài liệu trên mạng, phân tích, hệ thống hóa tài liệu, viết mã lập trình, giải quyết bài toán phức tạp và điều phối các công cụ MCP.
- Luôn phản hồi bằng tiếng Việt tự nhiên, có định dạng Markdown trực quan, khoa học, đầy đủ dẫn chứng và thẩm mỹ cao.`,
};

export class OpenAIService {
  private settings: AISettings;
  private lastUsedEndpointInfo: { name: string; isFallback: boolean } = {
    name: 'Xkiro AI Gateway (Primary)',
    isFallback: false,
  };

  constructor() {
    this.settings = this.loadSettings();
  }

  public loadSettings(): AISettings {
    try {
      const saved = localStorage.getItem('kim_ai_settings') || localStorage.getItem('cat_ai_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_AI_SETTINGS,
          ...parsed,
          fallbackEndpoints: parsed.fallbackEndpoints || DEFAULT_FALLBACK_ENDPOINTS,
        };
      }
    } catch {
      // Fallback
    }
    return { ...DEFAULT_AI_SETTINGS };
  }

  public saveSettings(newSettings: Partial<AISettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem('kim_ai_settings', JSON.stringify(this.settings));
    } catch {
      // Ignore
    }
  }

  public getSettings(): AISettings {
    return { ...this.settings };
  }

  public getLastUsedEndpointInfo() {
    return this.lastUsedEndpointInfo;
  }

  private normalizeUrl(url: string): string {
    return url.replace(/\/+$/, '');
  }

  /**
   * Internal worker to execute a completion request on a single endpoint
   */
  private async executeSingleEndpoint({
    endpointUrl,
    apiKey,
    model,
    systemPrompt,
    messages,
    temperature,
    topP,
    contextWindow,
    streaming,
    tools,
    signal,
    onChunk,
    onDone,
  }: {
    endpointUrl: string;
    apiKey: string;
    model: string;
    systemPrompt: string;
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    temperature: number;
    topP: number;
    contextWindow: number;
    streaming: boolean;
    tools?: any[];
    signal?: AbortSignal;
    onChunk?: (token: string, fullText: string) => void;
    onDone?: (fullText: string) => void;
  }): Promise<string> {
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const cleanBaseUrl = this.normalizeUrl(endpointUrl || 'https://api.xkiro.com/v1');
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

    const tryFetch = async (targetEndpoint: string, useProxy: boolean = false): Promise<Response> => {
      let finalUrl = targetEndpoint;
      if (useProxy) {
        finalUrl = `/api/proxy?target=${encodeURIComponent(targetEndpoint)}`;
      }

      return fetch(finalUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload),
        signal,
      });
    };

    let response: Response;
    try {
      response = await tryFetch(endpoint, false);
    } catch (err: any) {
      try {
        response = await tryFetch(endpoint, true);
      } catch (proxyErr: any) {
        throw new Error(`Không thể kết nối đến máy chủ (${endpoint}). Lỗi: ${err?.message || proxyErr?.message}`);
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
      throw new Error(`HTTP ${response.status} (${response.statusText}): ${errorDetail || 'Không có phản hồi chi tiết'}`);
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
   * Chat completion with Multi-API Fallback Support
   */
  public async chatCompletion({
    messages,
    onChunk,
    onDone,
    onError,
    signal,
    tools,
    onFallbackTriggered,
  }: {
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    onChunk?: (token: string, fullText: string) => void;
    onDone?: (fullText: string) => void;
    onError?: (error: Error) => void;
    signal?: AbortSignal;
    tools?: any[];
    onFallbackTriggered?: (fallbackName: string, originalError: string) => void;
  }): Promise<string> {
    const {
      baseUrl,
      apiKey,
      model,
      temperature,
      topP,
      contextWindow,
      streaming,
      systemPrompt,
      autoFallbackEnabled,
      fallbackEndpoints,
    } = this.settings;

    // Candidate list: Primary first, then enabled fallback endpoints in priority order
    interface Candidate {
      id: string;
      name: string;
      baseUrl: string;
      apiKey: string;
      model: string;
      isPrimary: boolean;
    }

    const candidateList: Candidate[] = [
      {
        id: 'primary',
        name: `Cổng chính (${this.settings.provider.toUpperCase()} - ${model})`,
        baseUrl,
        apiKey,
        model,
        isPrimary: true,
      },
    ];

    if (autoFallbackEnabled && fallbackEndpoints && fallbackEndpoints.length > 0) {
      const activeFallbacks = [...fallbackEndpoints]
        .filter(f => f.enabled)
        .sort((a, b) => (a.priority || 0) - (b.priority || 0))
        .map(f => ({
          id: f.id,
          name: f.name,
          baseUrl: f.baseUrl,
          apiKey: f.apiKey,
          model: f.model,
          isPrimary: false,
        }));

      candidateList.push(...activeFallbacks);
    }

    const errors: Array<{ name: string; error: string }> = [];

    // Iterate through candidates until one succeeds
    for (let i = 0; i < candidateList.length; i++) {
      const candidate = candidateList[i];

      try {
        if (!candidate.isPrimary) {
          onFallbackTriggered?.(candidate.name, errors[errors.length - 1]?.error || 'Cổng trước gặp sự cố');
        }

        const result = await this.executeSingleEndpoint({
          endpointUrl: candidate.baseUrl,
          apiKey: candidate.apiKey,
          model: candidate.model,
          systemPrompt,
          messages,
          temperature,
          topP,
          contextWindow,
          streaming,
          tools,
          signal,
          onChunk,
          onDone,
        });

        this.lastUsedEndpointInfo = {
          name: candidate.name,
          isFallback: !candidate.isPrimary,
        };

        return result;
      } catch (err: any) {
        console.warn(`[Thư Ký Kim Failover] Endpoint ${candidate.name} thất bại:`, err.message);
        errors.push({ name: candidate.name, error: err.message });

        // If this is the last candidate, re-throw comprehensive error
        if (i === candidateList.length - 1) {
          const summary = errors.map(e => `• ${e.name}: ${e.error}`).join('\n');
          const finalError = new Error(`Tất cả các cổng API (${candidateList.length} cổng) đều không phản hồi:\n${summary}`);
          onError?.(finalError);
          throw finalError;
        }
      }
    }

    throw new Error('Không thể kết nối đến bất kỳ cổng API nào.');
  }

  /**
   * Test a specific endpoint
   */
  public async testEndpoint(endpoint: { baseUrl: string; apiKey: string; model: string; name?: string }): Promise<{
    success: boolean;
    message: string;
    latencyMs: number;
  }> {
    const start = performance.now();
    try {
      const res = await this.executeSingleEndpoint({
        endpointUrl: endpoint.baseUrl,
        apiKey: endpoint.apiKey,
        model: endpoint.model,
        systemPrompt: 'Trả lời duy nhất 1 từ: "PONG".',
        messages: [{ role: 'user', content: 'Ping!' }],
        temperature: 0.1,
        topP: 0.9,
        contextWindow: 64,
        streaming: false,
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

  /**
   * Quick connection test for primary endpoint
   */
  public async testConnection(): Promise<{ success: boolean; message: string; latencyMs: number }> {
    return this.testEndpoint({
      baseUrl: this.settings.baseUrl,
      apiKey: this.settings.apiKey,
      model: this.settings.model,
      name: 'Primary Gateway',
    });
  }
}

export const openAIService = new OpenAIService();

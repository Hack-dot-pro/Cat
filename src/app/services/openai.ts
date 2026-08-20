export type AIProvider = 'openai' | 'openrouter' | 'groq' | 'deepseek' | 'ollama' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  streaming: boolean;
}

export interface ProviderPreset {
  id: AIProvider;
  name: string;
  defaultBaseUrl: string;
  defaultModel: string;
  suggestedModels: string[];
  requiresKey: boolean;
  docUrl: string;
}

export const PROVIDER_PRESETS: Record<AIProvider, ProviderPreset> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    suggestedModels: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'gpt-4-turbo'],
    requiresKey: true,
    docUrl: 'https://platform.openai.com/api-keys',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'deepseek/deepseek-chat',
    suggestedModels: [
      'deepseek/deepseek-chat',
      'anthropic/claude-3.5-sonnet',
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-2.5-pro',
      'mistralai/mistral-large',
    ],
    requiresKey: true,
    docUrl: 'https://openrouter.ai/keys',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    suggestedModels: ['deepseek-chat', 'deepseek-reasoner'],
    requiresKey: true,
    docUrl: 'https://platform.deepseek.com',
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    suggestedModels: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'deepseek-r1-distill-llama-70b',
    ],
    requiresKey: true,
    docUrl: 'https://console.groq.com/keys',
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.3',
    suggestedModels: ['llama3.3', 'qwen2.5-coder', 'deepseek-r1', 'mistral'],
    requiresKey: false,
    docUrl: 'https://ollama.com',
  },
  custom: {
    id: 'custom',
    name: 'Custom OpenAI-Compatible',
    defaultBaseUrl: 'https://your-custom-endpoint.com/v1',
    defaultModel: 'custom-model',
    suggestedModels: ['custom-model', 'gpt-4o', 'deepseek-chat'],
    requiresKey: true,
    docUrl: '',
  },
};

const DEFAULT_SYSTEM_PROMPT =
  'You are CAT, a futuristic holographic AI operating system. Respond concisely, intelligently, and with high precision. Format your responses clearly, and maintain a calm, highly capable sci-fi AI persona.';

const STORAGE_KEY = 'cat_ai_config_v1';

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  streaming: true,
};

export function getStoredAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AI_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_AI_CONFIG, ...parsed };
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export function saveStoredAIConfig(config: AIConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save AI config to localStorage', err);
  }
}

export interface ChatMessageParam {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessageParam[];
  config: AIConfig;
  signal?: AbortSignal;
  onChunk?: (chunk: string, accumulated: string) => void;
}

function normalizeUrl(baseUrl: string, endpoint: string = '/chat/completions'): string {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '');
  if (cleanBase.endsWith('/chat/completions')) {
    return cleanBase;
  }
  return `${cleanBase}${endpoint}`;
}

export async function callOpenAIChatCompletion({
  messages,
  config,
  signal,
  onChunk,
}: ChatCompletionOptions): Promise<string> {
  const url = normalizeUrl(config.baseUrl, '/chat/completions');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey && config.apiKey.trim()) {
    headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
  }

  // Extra headers for OpenRouter
  if (config.provider === 'openrouter' || config.baseUrl.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'CAT AI Operating System';
  }

  const payload = {
    model: config.model.trim(),
    messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    stream: Boolean(config.streaming && onChunk),
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(
      `API Error (${response.status} ${response.statusText}): ${errorDetail || 'Request failed'}`
    );
  }

  // Handle Streaming (SSE)
  if (config.streaming && onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue; // comments or empty
        if (trimmed === 'data: [DONE]') continue;

        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const delta = data.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullText += delta;
              onChunk(delta, fullText);
            }
          } catch {
            // Ignore malformed JSON chunks
          }
        }
      }
    }

    if (fullText.trim()) {
      return fullText;
    }
  }

  // Fallback or non-streaming JSON
  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || '';
  if (onChunk && reply) {
    onChunk(reply, reply);
  }
  return reply;
}

export async function testAIConnection(
  config: AIConfig
): Promise<{ success: boolean; latencyMs: number; message: string; modelUsed: string }> {
  const start = performance.now();
  try {
    const reply = await callOpenAIChatCompletion({
      messages: [
        { role: 'system', content: 'Respond with only "OK"' },
        { role: 'user', content: 'Ping' },
      ],
      config: { ...config, streaming: false, maxTokens: 10 },
    });
    const latency = Math.round(performance.now() - start);
    return {
      success: true,
      latencyMs: latency,
      message: `Connection successful! Response: "${reply.trim()}"`,
      modelUsed: config.model,
    };
  } catch (err: any) {
    const latency = Math.round(performance.now() - start);
    return {
      success: false,
      latencyMs: latency,
      message: err.message || 'Connection failed',
      modelUsed: config.model,
    };
  }
}

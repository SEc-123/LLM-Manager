import { FileAnalysisConfig } from '../types';

// 修改为相对路径,让代理生效
const OLLAMA_BASE_URL = '/api';

const TIMEOUT_MS = 30000; // 30 seconds timeout
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  template?: string;
  context?: number[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_k?: number;
    top_p?: number;
    num_predict?: number;
    stop?: string[];
    repeat_last_n?: number;
    repeat_penalty?: number;
    num_ctx?: number;
    num_gpu?: number;
    seed?: number;
  };
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
  error?: string;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    families?: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaModelList {
  models: OllamaModel[];
}

// 添加超时控制的 fetch
async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeout?: number }
): Promise<Response> {
  const { timeout = TIMEOUT_MS, ...options } = init || {};

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(input, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// 添加重试逻辑的包装函数
async function withRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY_MS
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

// 生成补全（流式输出）
export async function generateCompletionStream(
  request: OllamaGenerateRequest,
  onMessage: (response: OllamaResponse) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): Promise<void> {
  let retries = MAX_RETRIES;

  const attemptStream = async () => {
    try {
      const response = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...request, stream: true }),
        timeout: TIMEOUT_MS
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is null');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          if (buffer) {
            try {
              const json = JSON.parse(buffer);
              onMessage(json);
            } catch (e) {
              console.error('Error parsing final buffer:', e);
            }
          }
          onComplete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          
          if (line.trim()) {
            try {
              const json = JSON.parse(line);
              onMessage(json);
            } catch (e) {
              console.error('Error parsing JSON:', e);
            }
          }
        }
      }
    } catch (error) {
      if (retries > 0) {
        console.log(`Retrying stream... ${retries} attempts remaining`);
        retries--;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return attemptStream();
      }
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  };

  await attemptStream();
}

// 生成补全（非流式）
export async function generateCompletion(
  request: OllamaGenerateRequest
): Promise<OllamaResponse> {
  return withRetry(async () => {
    const response = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...request, stream: false }),
      timeout: TIMEOUT_MS
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  });
}

// 列出可用模型
export async function listModels(): Promise<OllamaModel[]> {
  return withRetry(async () => {
    const response = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: TIMEOUT_MS
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: OllamaModelList = await response.json();
    return data.models;
  });
}

// 获取模型详细信息
export async function getModelInfo(modelName: string): Promise<OllamaModel | null> {
  return withRetry(async () => {
    const response = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/show`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
      timeout: TIMEOUT_MS
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  });
}

// 检查Ollama服务是否可用
export async function checkOllamaService(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 5000 // 使用更短的超时时间检查服务
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// 拉取模型
export async function pullModel(
  modelName: string,
  onProgress?: (progress: { completed: boolean; status: string; percentage?: number }) => void
): Promise<void> {
  let retries = MAX_RETRIES;

  const attemptPull = async () => {
    try {
      const response = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName }),
        timeout: TIMEOUT_MS * 2 // 拉取模型需要更长的超时时间
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is null');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onProgress?.({ completed: true, status: 'Model pull completed' });
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          
          if (line.trim()) {
            try {
              const progress = JSON.parse(line);
              onProgress?.({
                completed: false,
                status: progress.status,
                percentage: progress.completed && progress.total 
                  ? (progress.completed / progress.total) * 100 
                  : undefined
              });
            } catch (e) {
              console.error('Error parsing progress JSON:', e);
            }
          }
        }
      }
    } catch (error) {
      if (retries > 0) {
        console.log(`Retrying pull... ${retries} attempts remaining`);
        retries--;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return attemptPull();
      }
      throw error;
    }
  };

  await attemptPull();
}

// 复制模型
export async function copyModel(
  source: string,
  destination: string
): Promise<void> {
  return withRetry(async () => {
    const response = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/copy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source,
        destination
      }),
      timeout: TIMEOUT_MS
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  });
}

// 删除模型
export async function deleteModel(modelName: string): Promise<void> {
  return withRetry(async () => {
    const response = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
      timeout: TIMEOUT_MS
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  });
}
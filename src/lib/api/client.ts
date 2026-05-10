import type { ApiError } from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/';

class ApiClientError extends Error {
  readonly status: number;
  readonly errors: ApiError[];

  constructor(status: number, message: string, errors: ApiError[] = []) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errors = errors;
  }
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

function tryParseJson(text: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

async function request<T>(options: RequestOptions): Promise<T> {
  const { method, path, body, params, signal, headers: extraHeaders } = options;

  const headers = new Headers({
    'Content-Type': 'application/json',
    ...extraHeaders,
  });

  const fetchOptions: RequestInit = {
    method,
    headers,
    signal,
  };

  if (body !== undefined && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path, params), fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    const errorBody = tryParseJson(errorText) as { message?: string; errors?: ApiError[] } | undefined;

    throw new ApiClientError(
      response.status,
      errorBody?.message ?? `请求失败: ${response.status} ${response.statusText}`,
      errorBody?.errors ?? [],
    );
  }

  const data = (await response.json()) as T;
  return data;
}

async function uploadFile<T>(
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
  extraFields?: Record<string, string>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    if (extraFields) {
      for (const [key, value] of Object.entries(extraFields)) {
        formData.append(key, value);
      }
    }

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText) as T;
          resolve(response);
        } catch {
          reject(new ApiClientError(xhr.status, '响应解析失败'));
        }
      } else {
        const errorBody = tryParseJson(xhr.responseText) as { message?: string } | undefined;
        reject(
          new ApiClientError(
            xhr.status,
            errorBody?.message ?? `上传失败: ${xhr.status}`,
          ),
        );
      }
    });

    xhr.addEventListener('error', () => {
      reject(new ApiClientError(0, '网络错误，请检查连接'));
    });

    xhr.addEventListener('abort', () => {
      reject(new ApiClientError(0, '请求已取消'));
    });

    xhr.open('POST', buildUrl(path));
    xhr.send(formData);
  });
}

export function get<T>(path: string, params?: RequestOptions['params'], signal?: AbortSignal): Promise<T> {
  return request<T>({ method: 'GET', path, params, signal });
}

export function post<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>({ method: 'POST', path, body, signal });
}

export function put<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>({ method: 'PUT', path, body, signal });
}

export function patch<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>({ method: 'PATCH', path, body, signal });
}

export function del<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>({ method: 'DELETE', path, body, signal });
}

export { uploadFile, ApiClientError };

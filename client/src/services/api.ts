const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  public code: string;
  public status: number;
  public issues?: any[];

  constructor(message: string, status: number, code = 'API_ERROR', issues?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

interface RequestOptions extends RequestInit {
  data?: any;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { data, headers, ...customOptions } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const config: RequestInit = {
    ...customOptions,
    credentials: 'include', // Ensure cookies are sent and received cross-origin
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    },
  };

  if (data !== undefined) {
    config.body = JSON.stringify(data);
  }

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: any) {
    throw new ApiError(
      err.message || 'Network request failed. Is the ChessNova server running?',
      0,
      'NETWORK_ERROR'
    );
  }

  let responseData: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    const message =
      responseData?.error?.message ||
      responseData?.message ||
      `Request failed with status ${response.status}`;
    const code = responseData?.error?.code || responseData?.code || 'HTTP_ERROR';
    const issues = responseData?.error?.issues;

    throw new ApiError(message, response.status, code, issues);
  }

  return responseData;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { method: 'GET', ...options }),
  post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { method: 'POST', data, ...options }),
  patch: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { method: 'PATCH', data, ...options }),
  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { method: 'DELETE', ...options }),
};


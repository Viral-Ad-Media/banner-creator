import { supabase } from './supabaseClient';

const rawBaseUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '/api';
const apiBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

const getAccessToken = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }

  return data.session?.access_token ?? null;
};

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
};

const buildUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (path.startsWith('/')) {
    return `${apiBaseUrl}${path}`;
  }

  return `${apiBaseUrl}/${path}`;
};

const createRequestInit = async (path: string, options: ApiFetchOptions = {}) => {
  const url = buildUrl(path);
  const { auth = true, headers, body, ...rest } = options;

  const mergedHeaders: HeadersInit = {
    ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(headers || {}),
  };

  if (auth) {
    const token = await getAccessToken();
    if (token) {
      (mergedHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }

  return {
    url,
    requestInit: {
      ...rest,
      headers: mergedHeaders,
      body,
    } satisfies RequestInit,
  };
};

const executeRequest = async (path: string, options: ApiFetchOptions = {}) => {
  const { url, requestInit } = await createRequestInit(path, options);

  let response: Response;
  try {
    response = await fetch(url, requestInit);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Cannot reach API at ${url}. Check VITE_API_BASE_URL and backend CORS_ORIGIN.`);
    }

    throw error;
  }

  return { response, url };
};

export const apiFetch = async <T>(path: string, options: ApiFetchOptions = {}): Promise<T> => {
  const { response } = await executeRequest(path, options);

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (typeof payload === 'object' && payload && 'error' in payload && String((payload as any).error)) ||
      response.statusText ||
      'Request failed';
    throw new Error(message);
  }

  return payload as T;
};

export const apiFetchBlob = async (path: string, options: ApiFetchOptions = {}): Promise<Blob> => {
  const { response } = await executeRequest(path, options);

  if (!response.ok) {
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();
    const message =
      (typeof payload === 'object' && payload && 'error' in payload && String((payload as any).error)) ||
      response.statusText ||
      'Request failed';
    throw new Error(message);
  }

  return response.blob();
};

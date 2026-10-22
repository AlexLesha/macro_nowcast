/**
 * Resolves the backend Quant API URL with a guaranteed fallback to Render.
 */

function sanitizeUrl(url?: string): string {
  if (!url) return '';
  return url
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[\[\]]/g, '')
    .trim()
    .replace(/\/$/, '');
}

const envUrl = sanitizeUrl(process.env.NEXT_PUBLIC_API_URL);

export const API_BASE_URL: string =
  envUrl !== '' ? envUrl : 'https://macro-nowcast-wdw2.onrender.com';

export const API_BASE: string = API_BASE_URL;

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined' && window.location.port === '8000') {
    return normalizedPath;
  }
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = getApiUrl(endpoint);
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
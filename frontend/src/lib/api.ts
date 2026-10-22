/**
 * Resolves the API endpoint URL for both local dev and production.
 * In production on Cloudflare Pages, relative paths (/api/...) are automatically
 * proxied to https://macro-nowcast-wdw2.onrender.com via _redirects.
 * If NEXT_PUBLIC_API_URL is explicitly provided, it prepends that base URL.
 */

function sanitizeUrl(url: string): string {
  // Strip markdown formatting if accidentally included: [url](url) -> url
  const cleaned = url.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[\[\]]/g, "").trim();
  return cleaned.replace(/\/$/, "");
}

export const API_BASE_URL = sanitizeUrl(
  process.env.NEXT_PUBLIC_API_URL || "https://macro-nowcast-wdw2.onrender.com"
);

export const API_BASE = API_BASE_URL;

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (API_BASE_URL && typeof window !== "undefined" && !window.location.host.includes("pages.dev")) {
    return `${API_BASE_URL}${normalizedPath}`;
  }
  return normalizedPath;
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}/${endpoint.replace(/^\//, "")}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
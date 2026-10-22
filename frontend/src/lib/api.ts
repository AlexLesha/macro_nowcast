/**
 * Resolves the API endpoint URL for both local dev and production.
 * In production on Cloudflare Pages, relative paths (/api/...) are automatically
 * proxied to https://macro-nowcast-wdw2.onrender.com via _redirects.
 * If NEXT_PUBLIC_API_URL is explicitly provided, it prepends that base URL.
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (API_BASE) {
    return `${API_BASE}${normalizedPath}`;
  }
  return normalizedPath;
}

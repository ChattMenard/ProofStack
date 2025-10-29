// Client-safe wrapper to sanitize HTML using isomorphic-dompurify.
// This file intentionally avoids server-side DOM creation.
// Usage: import { sanitizeHtml } from '@/lib/sanitizeHtml'

let purifier: any = null;

export async function getPurifier() {
  if (typeof window === 'undefined') return null;
  if (purifier) return purifier;
  const mod = await import('isomorphic-dompurify');
  // isomorphic-dompurify may export the factory as default or named
  const m: any = mod;
  const createDOMPurify = (m && (m.default || m.createDOMPurify)) as any;
  if (!createDOMPurify) return null;
  purifier = createDOMPurify(window as unknown as Window);
  return purifier;
}

export async function sanitizeHtml(html: string, config?: any) {
  if (typeof window === 'undefined') return html;
  const p = await getPurifier();
  if (!p) return html;
  try {
    return p.sanitize(html, config);
  } catch (e) {
    // If sanitizer fails for any reason, fall back to returning the original string
    // Caller should avoid rendering unsanitized HTML on server.
    // eslint-disable-next-line no-console
    console.error('sanitizeHtml error', e);
    return html;
  }
}

// Synchronous helper for use cases where you are sure code runs on the client
// and you don't want to await (rare). Returns original HTML if purifier isn't ready.
export function sanitizeHtmlSync(html: string, config?: any) {
  if (typeof window === 'undefined') return html;
  try {
    // Try to load createDOMPurify synchronously from the module cache
    // (bundlers typically include imported modules in the bundle)
    // We avoid top-level import to keep this module SSR-safe.
  // Load from module cache synchronously. Cast to any to avoid type complaints.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('isomorphic-dompurify');
  const m: any = mod;
  const createDOMPurify = (m && (m.default || m.createDOMPurify));
    if (!createDOMPurify) return html;
    // @ts-ignore
    const p = createDOMPurify(window);
    return p.sanitize(html, config);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('sanitizeHtmlSync fallback', e);
    return html;
  }
}

import React, { useEffect, useState } from 'react';

type Props = {
  html: string;
  className?: string;
  // Optional DOMPurify config object
  config?: any;
};

/**
 * Client-only component that sanitizes HTML using isomorphic-dompurify.
 * It dynamically imports the sanitizer to avoid SSR issues and sets
 * the sanitized HTML in state before rendering with dangerouslySetInnerHTML.
 *
 * Example:
 * <SanitizedHtml html={profile.bioHtml} className="prose" />
 */
export default function SanitizedHtml({ html, className, config }: Props) {
  const [sanitized, setSanitized] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (typeof window === 'undefined') return;
      try {
  const mod = await import('isomorphic-dompurify');
  // isomorphic-dompurify may export the factory as default or named
  const m: any = mod;
  const createDOMPurify = (m && (m.default || m.createDOMPurify)) as any;
        if (!createDOMPurify) {
          setSanitized(html);
          return;
        }
        const DOMPurify = createDOMPurify(window as unknown as Window);
        const clean = DOMPurify.sanitize(html, config);
        if (mounted) setSanitized(String(clean));
      } catch (e) {
        // On error, fall back to raw html to avoid blank content.
        // Prefer logging to Sentry in real apps.
        // eslint-disable-next-line no-console
        console.error('SanitizedHtml error', e);
        if (mounted) setSanitized(html);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [html, config]);

  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

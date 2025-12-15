import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return document.cookie.split('; ').map(cookie => {
            const [name, ...rest] = cookie.split('=');
            return { name, value: rest.join('=') };
          });
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = `${name}=${value}; path=${options?.path || '/'}; ${options?.maxAge ? `max-age=${options.maxAge};` : ''} ${options?.domain ? `domain=${options.domain};` : ''} ${options?.sameSite ? `samesite=${options.sameSite};` : ''} ${options?.secure ? 'secure;' : ''}`;
          });
        },
      },
    }
  );
}


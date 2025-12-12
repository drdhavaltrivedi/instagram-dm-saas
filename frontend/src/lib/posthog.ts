'use client';

import posthog from 'posthog-js';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize PostHog on the client side
    if (typeof window !== 'undefined') {
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

      if (posthogKey && posthogHost) {
        posthog.init(posthogKey, {
          api_host: posthogHost,
          person_profiles: 'identified_only', // Only create profiles for identified users
          capture_pageview: true, // Automatically capture pageviews
          capture_pageleave: true, // Capture pageleave events
          loaded: (posthog) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('PostHog initialized');
            }
          },
        });
      }
    }
  }, []);

  return <>{children}</>;
}

// Export PostHog instance for manual tracking
export { posthog };


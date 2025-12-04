/**
 * useAnalytics Hook
 * Automatically tracks pageviews on route changes in Next.js
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { trackPageView, logAnalyticsStatus } from '@/lib/analytics';

export const useAnalytics = () => {
    const router = useRouter();

    useEffect(() => {
        // Log analytics status in development
        if (process.env.NODE_ENV === 'development') {
            logAnalyticsStatus();
        }

        // Track initial pageview
        trackPageView(window.location.pathname + window.location.search);

        // Track pageviews on route change
        const handleRouteChange = (url: string) => {
            trackPageView(url);
        };

        router.events.on('routeChangeComplete', handleRouteChange);

        return () => {
            router.events.off('routeChangeComplete', handleRouteChange);
        };
    }, [router.events]);
};

export default useAnalytics;

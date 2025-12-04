import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '../components/ui/PageTransition';
import ArcReactorLoader from '../components/ui/ArcReactorLoader';
import { useState, useEffect } from 'react';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from '../context/ThemeContext';

// ==========================================
// ANALYTICS INTEGRATION
// ==========================================
import GoogleAnalytics from '../components/analytics/GoogleAnalytics';
import GoogleTagManager, { GoogleTagManagerNoScript } from '../components/analytics/GoogleTagManager';
import { useAnalytics } from '../hooks/useAnalytics';

function MyApp({ Component, pageProps }: AppProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Enable automatic pageview tracking
    useAnalytics();

    useEffect(() => {
        const handleStart = () => setLoading(true);
        const handleComplete = () => setTimeout(() => setLoading(false), 800); // Min display time

        router.events.on('routeChangeStart', handleStart);
        router.events.on('routeChangeComplete', handleComplete);
        router.events.on('routeChangeError', handleComplete);

        return () => {
            router.events.off('routeChangeStart', handleStart);
            router.events.off('routeChangeComplete', handleComplete);
            router.events.off('routeChangeError', handleComplete);
        };
    }, [router]);

    return (
        <>
            {/* Google Analytics 4 (GA4) */}
            <GoogleAnalytics />

            {/* Google Tag Manager (GTM) */}
            <GoogleTagManager />

            {/* GTM NoScript Fallback */}
            <GoogleTagManagerNoScript />

            <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
                <ThemeProvider>
                    <Head>
                        <title>BizTracker PRO SaaS</title>
                        <meta name="description" content="Enterprise Business Management Platform" />
                    </Head>
                    {loading && <ArcReactorLoader />}
                    <AnimatePresence mode="wait">
                        <PageTransition key={router.route}>
                            <Component {...pageProps} />
                        </PageTransition>
                    </AnimatePresence>
                </ThemeProvider>
            </GoogleOAuthProvider>
        </>
    );
}

export default MyApp;

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
import { Toaster } from 'react-hot-toast';
import { Syne, Manrope } from 'next/font/google';

const syne = Syne({
    subsets: ['latin'],
    variable: '--font-syne',
    display: 'swap',
});

const manrope = Manrope({
    subsets: ['latin'],
    variable: '--font-manrope',
    display: 'swap',
});

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
                    <main className={`${syne.variable} ${manrope.variable} font-sans`}>
                        <Head>
                            <title>BizTrackr PRO: Onyx Enterprise</title>
                            <meta name="description" content="High-Frequency Commerce OS" />
                        </Head>
                        {loading && <ArcReactorLoader />}
                        <AnimatePresence mode="wait">
                            <PageTransition key={router.route}>
                                <Component {...pageProps} />
                            </PageTransition>
                        </AnimatePresence>
                        <Toaster position="bottom-right" toastOptions={{
                            style: {
                                background: '#0F0F0F',
                                color: '#EDEDED',
                                border: '1px solid #333',
                                fontFamily: 'var(--font-manrope)',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#CCFF00',
                                    secondary: '#000',
                                },
                            },
                        }} />
                    </main>
                </ThemeProvider>
            </GoogleOAuthProvider>
        </>
    );
}

export default MyApp;

import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../components/ui/PageTransition';

import { GoogleOAuthProvider } from '@react-oauth/google';

function MyApp({ Component, pageProps }: AppProps) {
    const router = useRouter();
    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
            <Head>
                <title>BizTracker PRO SaaS</title>
                <meta name="description" content="Enterprise Business Management Platform" />
            </Head>
            <AnimatePresence exitBeforeEnter>
                <PageTransition key={router.route}>
                    <Component {...pageProps} />
                </PageTransition>
            </AnimatePresence>
        </GoogleOAuthProvider>
    );
}

export default MyApp;

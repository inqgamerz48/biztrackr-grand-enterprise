import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

import { GoogleOAuthProvider } from '@react-oauth/google';

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
            <Head>
                <title>BizTracker PRO SaaS</title>
                <meta name="description" content="Enterprise Business Management Platform" />
            </Head>
            <Component {...pageProps} />
        </GoogleOAuthProvider>
    );
}

export default MyApp;

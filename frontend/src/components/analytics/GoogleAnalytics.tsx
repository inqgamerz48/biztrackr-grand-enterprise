/**
 * Google Analytics 4 (GA4) Script Component
 * Measurement ID: G-GW8N42TF9G
 */

import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-GW8N42TF9G';

export default function GoogleAnalytics() {
    return (
        <>
            {/* Google Analytics Script */}
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />

            {/* GA4 Configuration */}
            <Script
                id="google-analytics-config"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              send_page_view: true
            });
          `,
                }}
            />
        </>
    );
}

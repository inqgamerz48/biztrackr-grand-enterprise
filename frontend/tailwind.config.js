/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Analog Enterprise Palette
                ink: '#080808',      // Warmer, deeper black (Cai Guo-Qiang Gunpowder)
                paper: '#F4F4F0',    // Off-white / Newsprint (for text/contrast)
                'intl-orange': '#FF3300', // International Orange (Aerospace/Industrial)
                ash: '#1C1C1C',      // Soft charcoal for cards

                // Semantic Mappings - DARK MODE ONLY
                background: '#080808', // Ink
                foreground: '#EAEAEA', // Off-white text
                primary: {
                    DEFAULT: '#FF3300', // International Orange
                    foreground: '#FFFFFF',
                },
                card: '#121212',      // Slightly lighter ink
                border: '#2A2A2A',    // Matte border
                muted: '#2A2A2A',
                'muted-foreground': '#888888',

                // Legacy / Compat
                white: '#FFFFFF',
                black: '#000000',
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'sans-serif'], // Inter
                serif: ['var(--font-serif)', 'serif'],     // Fraunces
                display: ['var(--font-serif)', 'serif'],   // Fraunces for display too
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                // Film Grain overlay (Heavier, more organic)
                'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E\")",
            },
            animation: {
                'fade-in': 'fadeIn 0.6s ease-out forwards', // Slower, more deliberate
                'slide-up': 'slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(15px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}

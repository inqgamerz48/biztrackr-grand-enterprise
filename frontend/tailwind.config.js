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
                // Obsidian Enterprise Palette
                obsidian: '#050505',
                charcoal: '#0F0F0F',
                mist: '#EDEDED',
                'neon-lime': '#CCFF00',
                
                // Semantic Mappings
                background: '#050505',
                foreground: '#EDEDED',
                primary: {
                    DEFAULT: '#CCFF00',
                    foreground: '#050505',
                },
                card: '#0F0F0F',
                border: '#1A1A1A',
                muted: '#1A1A1A',
                
                // Legacy / Compat
                white: '#FFFFFF',
                black: '#000000',
            },
            fontFamily: {
                sans: ['var(--font-manrope)', 'sans-serif'],
                display: ['var(--font-syne)', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                 // Subtle noise overlay
                'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E\")",
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}

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
                background: '#000000',
                foreground: '#FFFFFF',
                primary: {
                    DEFAULT: '#FFFFFF',
                    foreground: '#000000',
                },
                secondary: {
                    DEFAULT: '#000000',
                    foreground: '#FFFFFF',
                },
                // Keeping these for compatibility but mapping them to the 2 colors
                slate: {
                    50: '#000000',
                    100: '#000000',
                    200: '#333333',
                    300: '#555555',
                    400: '#777777',
                    500: '#999999',
                    600: '#BBBBBB',
                    700: '#DDDDDD',
                    800: '#EEEEEE',
                    900: '#FFFFFF',
                    950: '#FFFFFF',
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
        },
    },
    plugins: [],
}

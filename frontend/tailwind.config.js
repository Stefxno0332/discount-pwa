/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                amazon: {
                    orange: '#FF9900',
                    'orange-dark': '#E88B00',
                    'orange-light': '#FFB84D',
                    blue: '#232F3E',
                    'blue-dark': '#191F28',
                    'blue-light': '#37475A'
                },
                dark: {
                    bg: '#0F172A',
                    card: '#1E293B',
                    border: '#334155',
                    text: '#E2E8F0',
                    muted: '#94A3B8'
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'fade-in': 'fadeIn 0.2s ease-out'
            },
            keyframes: {
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' }
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: 0 },
                    '100%': { transform: 'translateY(0)', opacity: 1 }
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: 0 },
                    '100%': { transform: 'translateY(0)', opacity: 1 }
                },
                fadeIn: {
                    '0%': { opacity: 0 },
                    '100%': { opacity: 1 }
                }
            },
            boxShadow: {
                'glow': '0 0 20px rgba(255, 153, 0, 0.3)',
                'glow-lg': '0 0 40px rgba(255, 153, 0, 0.4)'
            }
        },
    },
    plugins: [],
}

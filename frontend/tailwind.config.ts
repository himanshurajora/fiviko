import type { Config } from 'tailwindcss';

/** Fiviko design system (spec §6). A friendly, playful finance-gamification palette. */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C63FF',
          dark: '#4038C9',
        },
        secondary: '#00C2A8',
        accent: {
          yellow: '#FFD166',
          orange: '#FF8A3D',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        background: '#F7F8FC',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#1F2937',
          soft: '#6B7280',
        },
        'muted-border': '#E5E7EB',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        soft: '0 8px 30px -12px rgba(108, 99, 255, 0.25)',
        card: '0 4px 24px -8px rgba(31, 41, 55, 0.12)',
        glow: '0 0 0 4px rgba(108, 99, 255, 0.15)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6C63FF 0%, #4038C9 100%)',
        'gradient-mint': 'linear-gradient(135deg, #00C2A8 0%, #22C55E 100%)',
        'gradient-sun': 'linear-gradient(135deg, #FFD166 0%, #FF8A3D 100%)',
        'gradient-app': 'linear-gradient(180deg, #F7F8FC 0%, #EEF0FA 100%)',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;

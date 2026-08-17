/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Token bertema (berubah otomatis dark/light lewat CSS variable di index.css)
        void: 'rgb(var(--c-void) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--c-surface) / <alpha-value>)',
          raised: 'rgb(var(--c-surface-raised) / <alpha-value>)',
          hover: 'rgb(var(--c-surface-hover) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--c-border) / <alpha-value>)',
          light: 'rgb(var(--c-border-light) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          muted: 'rgb(var(--c-ink-muted) / <alpha-value>)',
          faint: 'rgb(var(--c-ink-faint) / <alpha-value>)',
        },
        // Brand biru BRI -- tetap sama di kedua tema
        brand: {
          DEFAULT: '#00529C',
          soft: '#2E86D4',
          dim: '#003B73',
          light: '#4FC3F7',
        },
        teal: {
          DEFAULT: '#0EA5A5',
          soft: '#5EEAD4',
        },
        pass: '#22C55E',
        warn: '#F59E0B',
        fail: '#EF4444',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'grid-lines':
          'linear-gradient(to right, rgb(var(--c-border-light) / 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--c-border-light) / 0.4) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '40px 40px',
      },
      boxShadow: {
        glow: '0 0 40px rgba(0,82,156,0.18)',
        card: '0 4px 24px rgba(0,20,50,0.12)',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: 0.8 },
          '100%': { transform: 'scale(1.6)', opacity: 0 },
        },
      },
      animation: {
        pulseRing: 'pulseRing 2.5s ease-out infinite',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Semua token di bawah dibaca dari CSS variables (lihat src/index.css)
        // supaya bisa berganti dark/light theme tanpa mengubah className di
        // komponen manapun. Warna brand mengikuti biru korporat BRI.
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
        brand: {
          DEFAULT: 'rgb(var(--c-brand) / <alpha-value>)',
          soft: 'rgb(var(--c-brand-soft) / <alpha-value>)',
          dim: 'rgb(var(--c-brand-dim) / <alpha-value>)',
        },
        teal: {
          DEFAULT: '#2DD4BF',
          soft: '#5EEAD4',
        },
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          muted: 'rgb(var(--c-ink-muted) / <alpha-value>)',
          faint: 'rgb(var(--c-ink-faint) / <alpha-value>)',
        },
        pass: '#34D399',
        warn: '#F59E0B',
        fail: '#F87171',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'grid-lines':
          'linear-gradient(to right, rgb(var(--c-border-light) / 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--c-border-light) / 0.5) 1px, transparent 1px)',
        'radial-glow':
          'radial-gradient(circle at 50% 0%, rgb(var(--c-brand) / 0.14), transparent 60%)',
      },
      backgroundSize: {
        grid: '40px 40px',
      },
      boxShadow: {
        glow: '0 0 40px rgb(var(--c-brand) / 0.18)',
        card: '0 4px 24px rgb(var(--c-shadow) / 0.35)',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: 0.8 },
          '100%': { transform: 'scale(1.6)', opacity: 0 },
        },
      },
      animation: {
        scan: 'scan 4s linear infinite',
        pulseRing: 'pulseRing 2.5s ease-out infinite',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/ui/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Background colors using Figma CSS variables
        figma: {
          bg: 'var(--figma-color-bg)',
          'bg-secondary': 'var(--figma-color-bg-secondary)',
          'bg-tertiary': 'var(--figma-color-bg-tertiary)',
          'bg-hover': 'var(--figma-color-bg-hover)',
          'bg-pressed': 'var(--figma-color-bg-pressed)',
          'bg-inverse': 'var(--figma-color-bg-inverse)',
          'bg-disabled': 'var(--figma-color-bg-disabled)',

          // Brand colors
          'bg-brand': 'var(--figma-color-bg-brand)',
          'bg-brand-hover': 'var(--figma-color-bg-brand-hover)',
          'bg-brand-pressed': 'var(--figma-color-bg-brand-pressed)',
          'bg-brand-secondary': 'var(--figma-color-bg-brand-secondary)',
          'bg-brand-tertiary': 'var(--figma-color-bg-brand-tertiary)',

          // Selected colors
          'bg-selected': 'var(--figma-color-bg-selected)',
          'bg-selected-hover': 'var(--figma-color-bg-selected-hover)',
          'bg-selected-pressed': 'var(--figma-color-bg-selected-pressed)',
          'bg-selected-strong': 'var(--figma-color-bg-selected-strong)',

          // Semantic colors
          'bg-danger': 'var(--figma-color-bg-danger)',
          'bg-danger-hover': 'var(--figma-color-bg-danger-hover)',
          'bg-danger-tertiary': 'var(--figma-color-bg-danger-tertiary)',
          'bg-warning': 'var(--figma-color-bg-warning)',
          'bg-warning-tertiary': 'var(--figma-color-bg-warning-tertiary)',
          'bg-success': 'var(--figma-color-bg-success)',
          'bg-success-tertiary': 'var(--figma-color-bg-success-tertiary)',

          // Text colors
          text: 'var(--figma-color-text)',
          'text-secondary': 'var(--figma-color-text-secondary)',
          'text-tertiary': 'var(--figma-color-text-tertiary)',
          'text-disabled': 'var(--figma-color-text-disabled)',
          'text-brand': 'var(--figma-color-text-brand)',
          'text-danger': 'var(--figma-color-text-danger)',
          'text-warning': 'var(--figma-color-text-warning)',
          'text-success': 'var(--figma-color-text-success)',
          'text-onbrand': 'var(--figma-color-text-onbrand)',
          'text-ondanger': 'var(--figma-color-text-ondanger)',
          'text-onsuccess': 'var(--figma-color-text-onsuccess)',
          'text-onselected': 'var(--figma-color-text-onselected)',

          // Icon colors
          icon: 'var(--figma-color-icon)',
          'icon-secondary': 'var(--figma-color-icon-secondary)',
          'icon-tertiary': 'var(--figma-color-icon-tertiary)',
          'icon-disabled': 'var(--figma-color-icon-disabled)',
          'icon-brand': 'var(--figma-color-icon-brand)',
          'icon-danger': 'var(--figma-color-icon-danger)',
          'icon-warning': 'var(--figma-color-icon-warning)',
          'icon-success': 'var(--figma-color-icon-success)',
          'icon-onbrand': 'var(--figma-color-icon-onbrand)',

          // Border colors
          border: 'var(--figma-color-border)',
          'border-strong': 'var(--figma-color-border-strong)',
          'border-disabled': 'var(--figma-color-border-disabled)',
          'border-selected': 'var(--figma-color-border-selected)',
          'border-brand': 'var(--figma-color-border-brand)',
          'border-danger': 'var(--figma-color-border-danger)',
          'border-danger-strong': 'var(--figma-color-border-danger-strong)',
          'border-success': 'var(--figma-color-border-success)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs: ['11px', '16px'],
        sm: ['12px', '16px'],
        base: ['13px', '20px'],
        lg: ['14px', '20px'],
      },
    },
  },
  plugins: [],
};

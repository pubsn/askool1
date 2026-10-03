/** @type {import('tailwindcss').Config} */
const BLUE = '#203c89';
const BLUE_DARK = '#16295e';
const BLUE_LIGHT = '#eef2fc';
const BLUE_PALE = '#dde4f4';
const SURFACE = '#f4f6fc';
const ORANGE = '#ee731f';
const ORANGE_DARK = '#d45f11';
const ORANGE_LIGHT = '#fdefe3';
const TEXT_SECONDARY = '#4d5670';
const TEXT_MUTED = '#7b849c';

// Palette-only grays: any gray/slate utility resolves to an ASKOOL token.
const grayScale = {
  50: SURFACE,
  100: BLUE_PALE,
  200: BLUE_PALE,
  300: TEXT_MUTED,
  400: TEXT_MUTED,
  500: TEXT_MUTED,
  600: TEXT_SECONDARY,
  700: TEXT_SECONDARY,
  800: '#1b2033',
  900: '#000000',
  950: '#000000',
};

const blueScale = {
  50: BLUE_LIGHT,
  100: BLUE_LIGHT,
  200: BLUE_PALE,
  300: BLUE_PALE,
  400: BLUE,
  500: BLUE,
  600: BLUE,
  700: BLUE_DARK,
  800: BLUE_DARK,
  900: BLUE_DARK,
};

const orangeScale = {
  50: ORANGE_LIGHT,
  100: ORANGE_LIGHT,
  200: ORANGE_LIGHT,
  300: ORANGE,
  400: ORANGE,
  500: ORANGE,
  600: ORANGE,
  700: ORANGE_DARK,
  800: ORANGE_DARK,
  900: ORANGE_DARK,
};

module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Poppins', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'page-title': ['2.125rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'section-title': ['1.0625rem', { lineHeight: '1.4' }],
        'body-base': ['0.9375rem', { lineHeight: '1.6' }],
        'label-base': ['0.875rem', { lineHeight: '1.4' }],
      },
      colors: {
        askool: {
          blue: BLUE,
          bluehover: BLUE_DARK,
          bluedark: BLUE_DARK,
          bluelight: BLUE_LIGHT,
          bluepale: BLUE_PALE,
          border: BLUE_PALE,
          surface: SURFACE,
          orange: ORANGE,
          orangehover: ORANGE_DARK,
          orangelight: ORANGE_LIGHT,
          cream: SURFACE,
          ink: '#000000',
          text: TEXT_SECONDARY,
          subtle: TEXT_MUTED,
        },
        gray: grayScale,
        slate: grayScale,
        neutral: grayScale,
        zinc: grayScale,
        stone: grayScale,
        blue: blueScale,
        indigo: blueScale,
        violet: blueScale,
        purple: blueScale,
        fuchsia: blueScale,
        sky: blueScale,
        cyan: blueScale,
        teal: blueScale,
        orange: orangeScale,
        amber: orangeScale,
        yellow: orangeScale,
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      boxShadow: {
        card: '0 1px 2px rgba(22, 41, 94, 0.04), 0 4px 16px rgba(22, 41, 94, 0.06)',
        'card-hover': '0 4px 8px rgba(22, 41, 94, 0.06), 0 12px 28px rgba(22, 41, 94, 0.10)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '1.25rem',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

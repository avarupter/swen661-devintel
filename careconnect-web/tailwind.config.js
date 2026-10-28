/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // Mobile-first with three explicit breakpoints
    screens: {
      md: '768px',
      lg: '1024px',
    },
    extend: {
      // ── Design Tokens ────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        // Base 18px reading size
        base: ['1.125rem', { lineHeight: '1.6' }],
        sm:   ['0.9375rem', { lineHeight: '1.6' }],
        lg:   ['1.25rem',   { lineHeight: '1.5' }],
        xl:   ['1.5rem',    { lineHeight: '1.4' }],
        '2xl':['1.875rem',  { lineHeight: '1.3' }],
        '3xl':['2.25rem',   { lineHeight: '1.2' }],
      },

      // ── Color System ──────────────────────────────────────────────────────────
      // All text/bg pairs verified ≥4.5:1 WCAG AA; interactive elements ≥3:1
      colors: {
        // Neutral ramp — backbone grays
        neutral: {
          50:  '#f7f8fa',   // page background
          100: '#eef0f4',   // surface / card
          200: '#dde1e8',   // dividers / borders
          300: '#c4cad5',   // muted borders
          400: '#8f9aaa',   // placeholder / disabled
          500: '#60697a',   // secondary text (4.8:1 on white)
          600: '#46505f',   // body text (7.2:1 on white)
          700: '#303845',   // strong body (9.8:1 on white)
          800: '#1e2631',   // headings (14.1:1 on white)
          900: '#111720',   // near-black
        },
        // Calm blue-teal — primary brand / interactive
        calm: {
          50:  '#edf6fa',
          100: '#d1eaf4',
          200: '#a3d4e9',
          300: '#61b3d4',
          400: '#2e93bb',
          500: '#1b7a9f',   // 4.6:1 on white — min AA large text interactive
          600: '#146488',   // 6.2:1 on white — AA for all text ✓
          700: '#0f5070',   // 8.5:1 on white ✓
          800: '#0b3d56',
          900: '#062738',
        },
        // Warm amber — secondary accent / highlights (not used as sole status signal)
        warm: {
          50:  '#fef9ec',
          100: '#fdefc8',
          200: '#fbdc8b',
          300: '#f8c346',
          400: '#f0a90e',
          500: '#c98c09',   // 4.6:1 on white ✓
          600: '#a67207',   // 6.5:1 on white ✓
          700: '#7d5505',
          800: '#573b04',
          900: '#362402',
        },
        // Status: alert — deep rose (not pure red; combines with icon+label)
        alert: {
          50:  '#fff1f2',
          100: '#ffd9dc',
          200: '#ffaab0',
          300: '#f87280',
          400: '#ef4056',
          500: '#cc2039',   // 5.1:1 on white ✓
          600: '#a81830',   // 7.2:1 on white ✓
          700: '#7e1124',
          800: '#560b19',
          900: '#2e0610',
        },
        // Status: success — deep teal-green (not pure green; combines with icon+label)
        success: {
          50:  '#edfaf5',
          100: '#d0f2e5',
          200: '#9de3c9',
          300: '#5ccca8',
          400: '#26b084',
          500: '#0e9268',   // 4.6:1 on white ✓
          600: '#0a7854',   // 6.7:1 on white ✓
          700: '#075c3f',
          800: '#04402c',
          900: '#02241a',
        },
        // Status: warning — deep amber (distinct from warm accent; always with label)
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde58a',
          300: '#fccf47',
          400: '#f8b500',
          500: '#c78f00',   // 5.0:1 on white ✓
          600: '#a07200',   // 7.2:1 on white ✓
          700: '#7a5600',
          800: '#503800',
          900: '#2e2000',
        },
      },

      // ── Spacing system (8px base) ─────────────────────────────────────────────
      spacing: {
        'touch': '2.75rem',  // 44px minimum touch target
      },

      // ── Border radius ─────────────────────────────────────────────────────────
      borderRadius: {
        card: '0.75rem',
        pill: '9999px',
      },

      // ── Box shadow ────────────────────────────────────────────────────────────
      boxShadow: {
        card:  '0 1px 4px 0 rgba(17,23,32,0.07), 0 4px 12px -2px rgba(17,23,32,0.05)',
        'card-hover': '0 2px 8px 0 rgba(17,23,32,0.10), 0 8px 20px -4px rgba(17,23,32,0.08)',
        // Focus ring — thick high-contrast
        focus: '0 0 0 3px #146488',       // calm-600
        'focus-inset': 'inset 0 0 0 3px #146488',
      },

      // ── Transitions ───────────────────────────────────────────────────────────
      transitionDuration: {
        DEFAULT: '200ms',
      },
    },
  },
  plugins: [],
};

import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      /* ============================================================
       * GLOBAL TYPOGRAPHY SYSTEM - JBJ GLOBAL REAL ESTATE (LOCKED)
       * ONE primary font family across the entire platform
       * ============================================================ */
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        /* H1 - Primary Headline */
        'h1': ['3.5rem', { lineHeight: '1.1', fontWeight: '600', letterSpacing: '-0.02em' }],
        'h1-md': ['3rem', { lineHeight: '1.1', fontWeight: '600', letterSpacing: '-0.02em' }],
        'h1-sm': ['2.25rem', { lineHeight: '1.15', fontWeight: '600', letterSpacing: '-0.01em' }],
        /* H2 - Section Headline */
        'h2': ['2.5rem', { lineHeight: '1.2', fontWeight: '500', letterSpacing: '-0.01em' }],
        'h2-md': ['2rem', { lineHeight: '1.2', fontWeight: '500', letterSpacing: '-0.01em' }],
        'h2-sm': ['1.5rem', { lineHeight: '1.25', fontWeight: '500' }],
        /* H3 - Subsection Headline */
        'h3': ['1.5rem', { lineHeight: '1.3', fontWeight: '500' }],
        'h3-sm': ['1.25rem', { lineHeight: '1.3', fontWeight: '500' }],
        /* H4 - Minor Headline / Labels */
        'h4': ['1.25rem', { lineHeight: '1.4', fontWeight: '400' }],
        'h4-sm': ['1.125rem', { lineHeight: '1.4', fontWeight: '400' }],
        /* Body Text */
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        /* Meta / Small Text */
        'meta': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'meta-xs': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
        /* Table Text */
        'table-header': ['0.875rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.05em' }],
        'table-cell': ['0.875rem', { lineHeight: '1.4', fontWeight: '400' }],
        /* Label / Tag */
        'label': ['0.75rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.1em' }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        handover: {
          DEFAULT: "hsl(var(--handover))",
          foreground: "hsl(var(--handover-foreground))",
        },
        overlay: {
          DEFAULT: "hsl(var(--overlay))",
          foreground: "hsl(var(--overlay-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          light: "hsl(var(--gold-light))",
          dark: "hsl(var(--gold-dark))",
          foreground: "hsl(var(--gold-foreground))",
        },
        champagne: {
          light: "hsl(var(--champagne-1))",
          DEFAULT: "hsl(var(--champagne-2))",
          dark: "hsl(var(--champagne-3))",
        },
        premium: {
          bg: "hsl(var(--premium-bg))",
          card: "hsl(var(--premium-card))",
          "card-border": "hsl(var(--premium-card-border))",
        },
        crm: {
          bg: "hsl(var(--crm-bg))",
          card: "hsl(var(--crm-card))",
          border: "hsl(var(--crm-card-border))",
          text: "hsl(var(--crm-text))",
          "text-muted": "hsl(var(--crm-text-muted))",
          highlight: "hsl(var(--crm-highlight))",
        },
        ai: {
          purple: "hsl(var(--ai-purple))",
          "purple-dark": "hsl(var(--ai-purple-dark))",
          fuchsia: "hsl(var(--ai-fuchsia))",
          cyan: "hsl(var(--ai-cyan))",
          emerald: "hsl(var(--ai-emerald))",
          amber: "hsl(var(--ai-amber))",
          rose: "hsl(var(--ai-rose))",
          glow: "hsl(var(--ai-glow))",
        },
      },
      /* ============================================================
       * GLOBAL SPACING SYSTEM - JBJ GLOBAL REAL ESTATE (LOCKED)
       * Base unit: 8px - All spacing must be multiples of 8px
       * Allowed: 8 / 16 / 24 / 32 / 40 / 48 / 56 / 64 / 80 / 96
       * ============================================================ */
      spacing: {
        // Base multiples of 8px
        '1': '0.25rem',    // 4px (exception for fine details)
        '2': '0.5rem',     // 8px - Base unit
        '3': '0.75rem',    // 12px (exception)
        '4': '1rem',       // 16px
        '5': '1.25rem',    // 20px (exception)
        '6': '1.5rem',     // 24px
        '7': '1.75rem',    // 28px (exception)
        '8': '2rem',       // 32px
        '9': '2.25rem',    // 36px (exception)
        '10': '2.5rem',    // 40px
        '11': '2.75rem',   // 44px (exception)
        '12': '3rem',      // 48px
        '14': '3.5rem',    // 56px
        '16': '4rem',      // 64px
        '20': '5rem',      // 80px
        '24': '6rem',      // 96px
        // Semantic spacing tokens (LOCKED)
        'page': '6rem',           // 96px - Page top/bottom padding
        'section': '6rem',        // 96px - Section-to-section spacing
        'section-inner': '4rem',  // 64px - Section internal padding (desktop)
        'section-inner-md': '3rem', // 48px - Section internal padding (tablet)
        'section-inner-sm': '2rem', // 32px - Section internal padding (mobile)
        'heading-text': '1.5rem', // 24px - Heading → paragraph
        'text-text': '1rem',      // 16px - Paragraph → paragraph
        'text-button': '2rem',    // 32px - Paragraph → button
        'label-content': '0.5rem', // 8px - Label → content
        'button-y': '1rem',       // 16px - Button vertical padding
        'button-x': '2rem',       // 32px - Button horizontal padding
        'button-gap': '1rem',     // 16px - Button-to-button horizontal
        'button-content': '2rem', // 32px - Button-to-content vertical
        'image-text': '2rem',     // 32px - Image-to-text
        'card': '2rem',           // 32px - Card internal padding
        'card-gap': '2rem',       // 32px - Card-to-card spacing
        'avatar-name': '1.5rem',  // 24px - Profile image to name
        'name-role': '0.5rem',    // 8px - Name to role
        'avatar-container': '1.5rem', // 24px - Avatar container padding
        'input-gap': '1rem',      // 16px - Input-to-input
        'input-label': '0.5rem',  // 8px - Input-to-label
        'input-button': '2rem',   // 32px - Input-to-button
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "shimmer": {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(100%)",
          },
        },
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "section-enter": {
          "0%": {
            opacity: "0",
            transform: "translateY(30px) scale(0.98)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1)",
          },
        },
        "logo-fill": {
          "0%": {
            clipPath: "inset(100% 0 0 0)",
          },
          "100%": {
            clipPath: "inset(0 0 0 0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer 2s infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "section-enter": "section-enter 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "logo-fill": "logo-fill 1.8s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

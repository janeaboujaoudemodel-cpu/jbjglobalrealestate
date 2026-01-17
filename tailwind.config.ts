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
       * Unified spacing rhythm across all systems
       * ============================================================ */
      spacing: {
        'section': '5rem',      // 80px - Standard section padding
        'section-sm': '3rem',   // 48px - Compact section padding
        'section-lg': '6rem',   // 96px - Large section padding
        'card': '1.5rem',       // 24px - Card internal padding
        'card-sm': '1rem',      // 16px - Compact card padding
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
  	extend: {
  		colors: {
        border: "hsl(var(--border))", // Mapped to --outline
        input: "hsl(var(--input))",   // Custom input background
        ring: "hsl(var(--ring))",     // Mapped to --primary for focus rings

        background: "hsl(var(--background))", // --surface equivalent
        foreground: "hsl(var(--foreground))", // --on-surface equivalent

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--on-primary))",
          container: "hsl(var(--primary-container))",
          'container-foreground': "hsl(var(--on-primary-container))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--on-secondary))",
          container: "hsl(var(--secondary-container))",
          'container-foreground': "hsl(var(--on-secondary-container))",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary))",
          foreground: "hsl(var(--on-tertiary))",
          container: "hsl(var(--tertiary-container))",
          'container-foreground': "hsl(var(--on-tertiary-container))",
        },
        error: { // Added error role
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--on-error))",
          container: "hsl(var(--error-container))",
          'container-foreground': "hsl(var(--on-error-container))",
        },
        muted: { // Muted typically for less important text/surfaces
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: { // Accent can be used for highlights, often maps to secondary or tertiary
          DEFAULT: "hsl(var(--accent))", // Kept existing mapping, but consider M3 roles
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: { // Destructive actions, maps to error
          DEFAULT: "hsl(var(--destructive))", // Mapped to --error
          foreground: "hsl(var(--destructive-foreground))", // Mapped to --on-error
        },
        card: { // Cards are surfaces
          DEFAULT: "hsl(var(--card))", // Mapped to --surface-variant
          foreground: "hsl(var(--card-foreground))", // Mapped to --on-surface-variant
        },
        popover: { // Popovers are surfaces
          DEFAULT: "hsl(var(--popover))", // Mapped to --surface
          foreground: "hsl(var(--popover-foreground))", // Mapped to --on-surface
        },
        surface: { // Explicit surface colors
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--on-surface))",
          variant: "hsl(var(--surface-variant))",
          'variant-foreground': "hsl(var(--on-surface-variant))",
        },
        outline: { // Explicit outline color
          DEFAULT: "hsl(var(--outline))",
          variant: "hsl(var(--outline-variant))",
        },
        // Keeping chart and sidebar colors as they are, unless specific M3 guidance is found for them
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: { // Assuming sidebar colors are specific and might not directly map to M3 roles
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
      fontFamily: {
        sans: ["Roboto Flex", "Arial", "Helvetica", "sans-serif"],
        // Add other M3 font styles if needed, e.g., serif, mono
      },
      fontSize: { // M3 Type Scale Examples (adjust values as needed)
        'display-lg': ['3.5625rem', { lineHeight: '4rem', letterSpacing: '-0.015625em', fontWeight: '400' }], // 57px
        'display-md': ['2.8125rem', { lineHeight: '3.25rem', letterSpacing: '0em', fontWeight: '400' }],    // 45px
        'display-sm': ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '0em', fontWeight: '400' }],     // 36px
        
        'headline-lg': ['2rem', { lineHeight: '2.5rem', letterSpacing: '0em', fontWeight: '400' }],      // 32px
        'headline-md': ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '0em', fontWeight: '400' }],     // 28px
        'headline-sm': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0em', fontWeight: '400' }],       // 24px

        'title-lg': ['1.375rem', { lineHeight: '1.75rem', letterSpacing: '0.009375em', fontWeight: '500' }], // 22px Medium, M3 uses 400/Regular for Title Large
        'title-md': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.009375em', fontWeight: '500' }],    // 16px Medium
        'title-sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.00714em', fontWeight: '500' }], // 14px Medium

        'body-lg': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.03125em', fontWeight: '400' }],     // 16px
        'body-md': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01786em', fontWeight: '400' }], // 14px
        'body-sm': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em', fontWeight: '400' }],      // 12px

        'label-lg': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.00714em', fontWeight: '500' }],// 14px Medium
        'label-md': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.03125em', fontWeight: '500' }],   // 12px Medium
        'label-sm': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.03125em', fontWeight: '500' }], // 11px Medium
      },
  		borderRadius: {
        // M3 Shape Scale
        none: '0px',
        xs: 'var(--radius-xs)',   // 4px
        sm: 'var(--radius-sm)',   // 8px
        md: 'var(--radius-md)',   // 12px (current --radius maps to this)
        lg: 'var(--radius-lg)',   // 16px
        xl: 'var(--radius-xl)',   // 28px
        full: 'var(--radius-full)' // 9999px
  		},
  		keyframes: { // Keep existing, or update to M3 motion if specific guidance found
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

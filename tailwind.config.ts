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
        // Example M3-style palette (replace with actual HSL values from a chosen M3 theme)
        // These HSL values are placeholders and should be properly defined.
        // For a real app, you'd use a tool to generate these from base colors.
        // Light Theme Colors (conceptual)
        'primary-light': 'hsl(210, 100%, 50%)', // Primary
        'on-primary-light': 'hsl(0, 0%, 100%)',   // Text/icon on Primary
        'primary-container-light': 'hsl(210, 100%, 90%)', // Lighter variant for containers
        'on-primary-container-light': 'hsl(210, 100%, 20%)', // Text/icon on Primary Container

        'secondary-light': 'hsl(180, 50%, 50%)',
        'on-secondary-light': 'hsl(0, 0%, 100%)',
        'secondary-container-light': 'hsl(180, 50%, 90%)',
        'on-secondary-container-light': 'hsl(180, 50%, 20%)',

        'tertiary-light': 'hsl(260, 50%, 60%)',
        'on-tertiary-light': 'hsl(0, 0%, 100%)',
        'tertiary-container-light': 'hsl(260, 50%, 90%)',
        'on-tertiary-container-light': 'hsl(260, 50%, 20%)',

        'error-light': 'hsl(0, 70%, 60%)',
        'on-error-light': 'hsl(0, 0%, 100%)',
        'error-container-light': 'hsl(0, 70%, 90%)',
        'on-error-container-light': 'hsl(0, 70%, 20%)',

        'surface-light': 'hsl(220, 25%, 98%)',        // Main background
        'on-surface-light': 'hsl(220, 10%, 10%)',     // Main text
        'surface-variant-light': 'hsl(220, 25%, 92%)', // Contrasting surface (e.g., cards)
        'on-surface-variant-light': 'hsl(220, 10%, 25%)',// Text on surface-variant
        'outline-light': 'hsl(220, 10%, 70%)',        // Borders

        // Dark Theme Colors (conceptual) - These would be different HSLs
        'primary-dark': 'hsl(210, 80%, 70%)',
        'on-primary-dark': 'hsl(210, 25%, 15%)',
        'primary-container-dark': 'hsl(210, 50%, 30%)',
        'on-primary-container-dark': 'hsl(210, 80%, 90%)',
        
        'secondary-dark': 'hsl(180, 40%, 70%)',
        'on-secondary-dark': 'hsl(180, 20%, 15%)',
        'secondary-container-dark': 'hsl(180, 30%, 30%)',
        'on-secondary-container-dark': 'hsl(180, 40%, 90%)',

        'tertiary-dark': 'hsl(260, 40%, 70%)',
        'on-tertiary-dark': 'hsl(260, 20%, 15%)',
        'tertiary-container-dark': 'hsl(260, 30%, 30%)',
        'on-tertiary-container-dark': 'hsl(260, 40%, 90%)',

        'error-dark': 'hsl(0, 60%, 70%)',
        'on-error-dark': 'hsl(0, 20%, 15%)',
        'error-container-dark': 'hsl(0, 40%, 30%)',
        'on-error-container-dark': 'hsl(0, 60%, 90%)',

        'surface-dark': 'hsl(220, 10%, 12%)',       // Dark main background
        'on-surface-dark': 'hsl(220, 10%, 90%)',    // Dark main text
        'surface-variant-dark': 'hsl(220, 10%, 20%)',// Dark contrasting surface
        'on-surface-variant-dark': 'hsl(220, 10%, 75%)',
        'outline-dark': 'hsl(220, 5%, 40%)',

        // Original theme colors (can be kept for reference or gradually replaced)
  			background: 'hsl(var(--background))', // Will map to surface-light/dark
  			foreground: 'hsl(var(--foreground))', // Will map to on-surface-light/dark
  			card: { // Will map to surface-variant-light/dark
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: { // Could map to a higher surface elevation
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: { // Will map to primary-light/dark
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: { // Will map to secondary-light/dark
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: { // Can map to a subtle surface variant or text color
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: { // Can map to tertiary or a specific accent color
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: { // Will map to error-light/dark
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))', // Will map to outline-light/dark
  			input: 'hsl(var(--input))', // Input specific styles will be handled
  			ring: 'hsl(var(--ring))',   // Focus ring, often primary or a dedicated focus color
  			chart: {
  				'1': 'hsl(var(--chart-1))', // Keep or update with M3 accent colors
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
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
  		borderRadius: {
        // M3 Shape Scale (conceptual mapping)
        'none': '0px',
        'xs': '4px',    // Extra Small
        'sm': '8px',    // Small
        'md': '12px',   // Medium (e.g., for cards, dialogs)
        'lg': '16px',   // Large (e.g., for larger cards, bottom sheets)
        'xl': '28px',   // Extra Large (e.g., for Floating Action Buttons)
        'full': '9999px', // Pill shape

        // Keeping original for compatibility, but prefer new scale
        'orig-lg': 'var(--radius)',
        'orig-md': 'calc(var(--radius) - 2px)',
        'orig-sm': 'calc(var(--radius) - 4px)'
  		},
      boxShadow: {
        // M3 Elevation Levels (conceptual mapping - light theme)
        // These would typically include subtle color tints in an actual M3 system.
        // Format: `offsetX offsetY blurRadius spreadRadius color`
        'm3-elev-1': '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)', // Similar to shadow-md
        'm3-elev-2': '0 3px 6px 0 rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)', // Between md and lg
        'm3-elev-3': '0 6px 10px 0 rgba(0,0,0,0.1), 0 3px 5px -3px rgba(0,0,0,0.1)', // Similar to shadow-lg
        'm3-elev-4': '0 8px 12px 0 rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)', // Between lg and xl
        'm3-elev-5': '0 12px 17px 0 rgba(0,0,0,0.1), 0 5px 8px -5px rgba(0,0,0,0.1)', // Similar to shadow-xl
        // Add dark theme shadows if needed, they might be less intense or different.
      },
  		keyframes: {
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

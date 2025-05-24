import type { Config } from 'tailwindcss'

const config = {
  darkMode: ['variant', '&:is(.dark *)'], // or 'media' or 'class'
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // For ShadCN UI components if they are in a specific path
    './@/**/*.{ts,tsx}', 
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
        // Style Guide Colors
        'primary-blue': '#003C7E',
        'light-grey-1': '#F5F7FA',
        'light-grey-2': '#E1E4E8',
        'mid-grey': '#8A929B',
        'accent-red-600': '#C51A2D', // Accent Red 600
        'accent-red-700': '#A10D26', // Accent Red 700
        'accent-red-500': '#E0212F', // Accent Red 500
        'accent-red-100': '#FCEBED', // Accent Red 100
        'accent-cyan': '#00D7FF', // Default Accent: Electric Cyan (keeping for now, might be legacy)
        'accent-lime-yellow': '#D3FF00', // Alternative Accent (keeping for now, might be legacy)



        
        // ShadCN UI colors (referencing CSS variables from globals.css)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))', // Assuming you'll add --destructive-foreground in globals.css if needed
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))', // Now references the --accent from globals.css
          foreground: 'hsl(var(--accent-foreground))', // Ensure this provides good contrast with the new red
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Menlo', 'Consolas', 'monospace'],
        condensed: ['var(--font-roboto-condensed)', 'var(--font-geist-sans)', 'sans-serif'],
        body: ['var(--font-inter)', 'var(--font-geist-sans)', 'sans-serif'],
      },
      keyframes: {
        // ShadCN UI uses these for animations
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate") // ShadCN UI often uses this
  ],
} satisfies Config

export default config 
/** Tailwind CSS Configuration for Cozy Sips POS App */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-container": "#f5ece9",
        "secondary-fixed": "#efe0cd",
        "on-secondary-container": "#6d6354",
        "tertiary-fixed-dim": "#b6d081",
        "on-surface": "#1f1b19",
        "on-primary-fixed-variant": "#613e31",
        "on-primary-container": "#bf9282",
        "on-tertiary-container": "#8ca55a",
        "surface-container-lowest": "#ffffff",
        "primary-container": "#4b2c20",
        "surface-dim": "#e1d8d6",
        "primary-fixed": "#ffdbce",
        "on-error": "#ffffff",
        "on-tertiary-fixed": "#141f00",
        "outline-variant": "#d5c3bd",
        "surface-tint": "#7b5647",
        "on-tertiary-fixed-variant": "#394d0c",
        "secondary-fixed-dim": "#d2c4b2",
        "surface-container-highest": "#eae1de",
        "background": "#fff8f6",
        "on-secondary": "#ffffff",
        "error-container": "#ffdad6",
        "on-primary-fixed": "#2e140a",
        "primary": "#32170d",
        "on-primary": "#ffffff",
        "surface-container-low": "#fbf2ef",
        "tertiary-fixed": "#d2ed9a",
        "inverse-surface": "#342f2e",
        "primary-fixed-dim": "#ecbcaa",
        "surface-variant": "#eae1de",
        "tertiary": "#162200",
        "secondary-container": "#efe0cd",
        "on-secondary-fixed-variant": "#4f4538",
        "secondary": "#675d4e",
        "inverse-on-surface": "#f8efec",
        "on-error-container": "#93000a",
        "outline": "#83746f",
        "surface-container-high": "#efe6e4",
        "inverse-primary": "#ecbcaa",
        "on-background": "#1f1b19",
        "surface-bright": "#fff8f6",
        "on-surface-variant": "#504440",
        "surface": "#fff8f6",
        "tertiary-container": "#273900",
        "on-tertiary": "#ffffff",
        "on-secondary-fixed": "#221a0f",
        "error": "#ba1a1a"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "container-padding": "20px",
        "md": "16px",
        "sm": "8px",
        "xl": "32px",
        "lg": "24px",
        "unit": "4px",
        "gutter": "12px",
        "xs": "4px"
      },
      fontFamily: {
        "title-lg": ["Montserrat", "sans-serif"],
        "headline-sm": ["Montserrat", "sans-serif"],
        "display-lg-mobile": ["Montserrat", "sans-serif"],
        "display-lg": ["Montserrat", "sans-serif"],
        "body-md": ["Montserrat", "sans-serif"],
        "body-lg": ["Montserrat", "sans-serif"],
        "display-md": ["Montserrat", "sans-serif"],
        "label-md": ["Montserrat", "sans-serif"]
      },
      fontSize: {
        "title-lg": ["18px", { "lineHeight": "24px", "fontWeight": "600" }],
        "headline-sm": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
        "display-lg-mobile": ["28px", { "lineHeight": "36px", "fontWeight": "700" }],
        "display-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "display-md": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "700" }],
        "label-md": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }]
      }
    }
  },
  plugins: []
}

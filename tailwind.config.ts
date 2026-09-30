import type { Config } from "tailwindcss";

// Design tokens COME-AND-FIGHT — base sombre, accents utilisés avec parcimonie.
// Direction : Apple × Gaming compétitif × Liquid Glass × CRAZY-TECH (identité originale).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        base: {
          void: "#05060A", // noir profond
          navy: "#0A0E1A", // navy très sombre
          graphite: "#14161C", // gris graphite
        },
        accent: {
          cyan: "#3DE1FF", // cyan électrique
          orange: "#FF7A2E", // orange énergétique
        },
        glass: {
          border: "rgba(255,255,255,0.08)",
          highlight: "rgba(255,255,255,0.14)",
          surface: "rgba(255,255,255,0.04)",
        },
      },
      backdropBlur: {
        glass: "20px",
      },
      borderRadius: {
        glass: "24px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.45)",
        glow: "0 0 24px rgba(61,225,255,0.25)",
      },
      fontFamily: {
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;

module.exports = {
  content: [
    "./index.html",
    "./*.tsx",
    "./components/**/*.tsx",
    "./pages/**/*.tsx",
  ],
  ...{
    theme: {
      extend: {
        fontFamily: {
          sans: ["Manrope", "sans-serif"],
          serif: ["Fraunces", "serif"],
          mono: ["monospace"],
          display: ["Montserrat", "sans-serif"],
          hand: ["Dancing Script", "cursive"],
        },
        colors: {
          background: "#071219",
          surface: "#101b24",
          primary: "#40d6c3",
          secondary: "#182732",
          accent: "#ffb166",
          text: "#f4f8fb",
          muted: "#8ea1b3",
        },
        animation: {
          "fade-in": "fadeIn 0.5s ease-out",
          "slide-up": "slideUp 0.4s ease-out",
          "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          "float-soft": "floatSoft 8s ease-in-out infinite",
        },
        keyframes: {
          fadeIn: {
            "0%": { opacity: "0" },
            "100%": { opacity: "1" },
          },
          slideUp: {
            "0%": { opacity: "0", transform: "translateY(20px)" },
            "100%": { opacity: "1", transform: "translateY(0)" },
          },
          floatSoft: {
            "0%, 100%": { transform: "translateY(0px)" },
            "50%": { transform: "translateY(-8px)" },
          },
        },
      },
    },
  },
};

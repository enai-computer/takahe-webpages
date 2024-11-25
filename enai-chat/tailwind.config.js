import tailwindcssRadixColors from "tailwindcss-radix-colors";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        birkin: "#F37021",
        sand: {
          11.5: "#51504B",
        },
        "sand-dark": {
          1: "#161615",
          2: "#1C1C1A",
          3: "#232320",
          4: "#282826",
          5: "#2E2E2B",
          6: "#353431",
          7: "#3E3E3A",
          8: "#51504B",
          9: "#717069",
          10: "#7F7E77",
          11: "#A1A09A",
          11.5: "#D0CFCA",
          12: "#EDEDEC",
        },
      },
      boxShadow: {
        'enai-drop': '0 0px 1px rgba(144, 144, 140, 1)',
      },
    },
  },
  plugins: [tailwindcssRadixColors],
};

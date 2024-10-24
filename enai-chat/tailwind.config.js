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
      },
      boxShadow: {
        'enai-drop': '0 0px 1px rgba(144, 144, 140, 1)',
      },
    },
  },
  plugins: [tailwindcssRadixColors],
};

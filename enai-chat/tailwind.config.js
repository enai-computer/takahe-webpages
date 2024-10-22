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
    },
  },
  plugins: [tailwindcssRadixColors],
};

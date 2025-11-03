/** @type {import('tailwindcss').Config} */
module.exports = {
  // Specify which files Tailwind should scan for utility classes
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Ensure the Poppins font is applied as the default sans-serif font
        sans: ['Poppins', 'sans-serif'], 
      },
    },
  },
  plugins: [],
}

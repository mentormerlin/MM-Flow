/**
 * Tailwind CSS configuration tailored for the Mentor Merlin flowchart application.
 *
 * This configuration enables purging of unused styles from your source
 * files, defines a colour palette that matches the Mentor Merlin branding
 * and leaves room for further customization. Feel free to adjust the
 * primary, secondary and accent values below to match updated branding.
 */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#013A8E',     // dark navy used throughout the UI
        secondary: '#01579B',   // mid‑tone blue for borders and accents
        accent: '#0A75C2'       // lighter blue for highlights and fills
      }
    }
  },
  plugins: []
};
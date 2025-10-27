/** @type {import('tailwindcss').Config} */
export default {
  important: true, // <-- 1. Thêm dòng này để "thắng" CSS của Ant Design
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // 2. Đã xóa keyframes và animation của ShadCN 🗑️
    },
  },
  plugins: [
    // 2. Đã xóa plugin "tailwindcss-animate" 🗑️
  ],
};

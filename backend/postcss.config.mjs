// backend/postcss.config.mjs   
/** @type {import('postcss').ProcessOptions} */
module.exports = {
  plugins: {
    // plugin oficial do Tailwind
    tailwindcss: {},
    // adiciona prefixos de navegador
    autoprefixer: {},
  },
};

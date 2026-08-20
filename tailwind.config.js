const colors = require('./src/theme/colors.js');

// Radii are duplicated as literal px strings here rather than require()'d from
// src/theme/radii.ts: that file is TypeScript and this config is plain CJS loaded by
// the Tailwind/NativeWind toolchain with no TS transform. Keep the two in sync by
// hand — src/theme/radii.ts carries the same three numbers for RN style objects.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors,
      borderRadius: {
        control: '12px',
        card: '16px',
        pill: '999px',
      },
      fontFamily: {
        // Plus Jakarta Sans ships one TTF per weight and RN Android registers each as
        // its own family name — a font-weight utility alone will NOT select them.
        // Every weight therefore gets an explicit family class.
        jakarta: ['PlusJakartaSans_400Regular'],
        'jakarta-medium': ['PlusJakartaSans_500Medium'],
        'jakarta-semibold': ['PlusJakartaSans_600SemiBold'],
        'jakarta-bold': ['PlusJakartaSans_700Bold'],
        'jakarta-extrabold': ['PlusJakartaSans_800ExtraBold'],
        sans: ['PlusJakartaSans_400Regular'],
      },
    },
  },
  plugins: [],
};

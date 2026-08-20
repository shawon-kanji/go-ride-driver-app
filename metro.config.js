const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Expo Router's require.context only excludes +api/+html/+middleware files by
// convention — it has no built-in awareness of Jest test files. Any *.test.tsx
// co-located inside src/app (e.g. plan 02-11's menu.test.tsx, sibling to the
// route it tests) would otherwise be auto-registered as its own route AND
// bundled into the app, pulling @testing-library/react-native's Node-only
// `console` polyfill into the Metro graph and breaking `expo export`. Block
// test files from Metro's module resolution; Jest resolves them independently
// via jest.config.js and is unaffected by this.
config.resolver.blockList = [...config.resolver.blockList, /\.test\.[jt]sx?$/];

module.exports = withNativeWind(config, { input: './src/global.css' });

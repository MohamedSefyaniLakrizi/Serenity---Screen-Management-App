// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // activity-report is a local Expo native module; its TypeScript types use
    // native-only APIs that eslint-plugin-import cannot fully parse at lint time.
    rules: {
      "import/namespace": ["error", { allowComputed: true }],
    },
    files: ["app/(tabs)/progress.tsx"],
  },
  {
    // activity-report is a local Expo native module; its TypeScript types use
    // native-only APIs that eslint-plugin-import cannot fully parse at lint time.
    rules: {
      'import/namespace': ['error', { allowComputed: true }],
    },
    files: ['app/(tabs)/progress.tsx'],
  },
]);

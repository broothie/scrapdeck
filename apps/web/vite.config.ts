import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function resolveBasePath() {
  const configuredBase = process.env.VITE_BASE_PATH?.trim();

  if (!configuredBase) {
    return "/";
  }

  const withLeadingSlash = configuredBase.startsWith("/")
    ? configuredBase
    : `/${configuredBase}`;

  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

export default defineConfig({
  base: resolveBasePath(),
  plugins: [react()],
  define: {
    global: "globalThis",
    "process.env": {},
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
    "process.env.TAMAGUI_TARGET": JSON.stringify("web"),
    "process.env.TAMAGUI_HEADLESS": JSON.stringify("0"),
    "process.env.TAMAGUI_ENVIRONMENT": JSON.stringify("client"),
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
        "process.env": "{}",
        "process.env.NODE_ENV": JSON.stringify(
          process.env.NODE_ENV ?? "development",
        ),
        "process.env.TAMAGUI_TARGET": JSON.stringify("web"),
        "process.env.TAMAGUI_HEADLESS": JSON.stringify("0"),
        "process.env.TAMAGUI_ENVIRONMENT": JSON.stringify("client"),
      },
    },
  },
  resolve: {
    alias: {
      "react-native": "react-native-web",
    },
  },
});

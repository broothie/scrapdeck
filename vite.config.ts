import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
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

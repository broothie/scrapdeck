import React from "react";
import ReactDOM from "react-dom/client";
import { TamaguiProvider } from "tamagui";
import config from "@scrapdeck/ui/tamagui-config";
import "@xyflow/react/dist/style.css";
import { App } from "./app/App";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TamaguiProvider config={config} defaultTheme="dark">
      <App />
    </TamaguiProvider>
  </React.StrictMode>,
);

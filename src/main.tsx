import React from "react";
import ReactDOM from "react-dom/client";
import { TamaguiProvider } from "tamagui";
import { App } from "./app/App";
import "./styles/globals.css";
import config from "./tamagui.config";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TamaguiProvider config={config} defaultTheme="dark">
      <App />
    </TamaguiProvider>
  </React.StrictMode>,
);

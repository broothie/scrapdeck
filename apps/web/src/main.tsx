import React from "react";
import ReactDOM from "react-dom/client";
import { TamaguiProvider } from "tamagui";
import config from "@plumboard/ui/tamagui-config";
import "@xyflow/react/dist/style.css";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TamaguiProvider config={config} defaultTheme="dark">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </TamaguiProvider>
  </React.StrictMode>,
);

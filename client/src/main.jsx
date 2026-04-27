import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./index.css";
import { ThemeProvider } from "@/components/theme-provider";
import App from "./app";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <TooltipProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </TooltipProvider>
  </StrictMode>
);

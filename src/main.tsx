import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { Analytics } from "@vercel/analytics/react";
import { theme } from "./theme";
import { SettingsProvider } from "./store/SettingsContext";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <SettingsProvider>
          <App />
        </SettingsProvider>
        <Analytics />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);

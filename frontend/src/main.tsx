import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AppCompatibilityProvider } from "./lib/appCompatibility";
import { UIProvider } from "./ui/UIProvider";
import "./i18n";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AppCompatibilityProvider>
          <AuthProvider>
            <UIProvider>
              <App />
            </UIProvider>
          </AuthProvider>
        </AppCompatibilityProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

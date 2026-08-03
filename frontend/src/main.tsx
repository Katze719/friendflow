import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AppCompatibilityProvider } from "./lib/appCompatibility";
import NativeBackNavigation from "./components/NativeBackNavigation";
import NativeUrlNavigation from "./components/NativeUrlNavigation";
import NativeAppShell from "./components/NativeAppShell";
import { UIProvider } from "./ui/UIProvider";
import { SyncProvider } from "./offline/SyncProvider";
import { Capacitor } from "@capacitor/core";
import "./i18n";
import "./index.css";

// Expose the runtime synchronously, before React paints, so CSS can choose a
// stable native WebView height instead of browser URL-bar viewport semantics.
document.documentElement.dataset.platform = Capacitor.getPlatform();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <NativeBackNavigation />
      <NativeUrlNavigation />
      <ThemeProvider>
        <NativeAppShell />
        <AppCompatibilityProvider>
          <AuthProvider>
            <SyncProvider>
              <UIProvider>
                <App />
              </UIProvider>
            </SyncProvider>
          </AuthProvider>
        </AppCompatibilityProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

if ("serviceWorker" in navigator && !Capacitor.isNativePlatform()) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}

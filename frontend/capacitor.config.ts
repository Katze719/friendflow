import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: process.env.CAPACITOR_APP_ID ?? "app.friendflow.mobile",
  appName: process.env.CAPACITOR_APP_NAME ?? "friendflow",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    // Android 15 enforces edge-to-edge rendering. Let Capacitor keep the
    // WebView clear of system bars instead of relying on device-specific
    // viewport behaviour.
    adjustMarginsForEdgeToEdge: "auto",
  },
  ios: {
    // Safe areas are owned by the web layer (`viewport-fit=cover` plus the
    // CSS env() insets), so UIKit must not add a second content inset.
    contentInset: "never",
  },
  plugins: {
    Keyboard: {
      // Resize the actual WebView so percentage heights and the app's single
      // scroll container follow the visible area above the keyboard.
      resize: KeyboardResize.Native,
      resizeOnFullScreen: true,
    },
    StatusBar: {
      // The header already consumes the safe-area inset. The icon style is
      // synchronised with the active theme at runtime.
      overlaysWebView: true,
      style: "DEFAULT",
    },
  },
  server: {
    androidScheme: "https",
  },
};

export default config;

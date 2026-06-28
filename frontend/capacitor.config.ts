import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: process.env.CAPACITOR_APP_ID ?? "app.friendflow.mobile",
  appName: process.env.CAPACITOR_APP_NAME ?? "friendflow",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
  },
};

export default config;

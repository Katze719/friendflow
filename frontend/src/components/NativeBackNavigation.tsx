import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { useEffect } from "react";

export default function NativeBackNavigation() {
  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;

    let cancelled = false;
    let listener: PluginListenerHandle | undefined;

    void CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
        return;
      }

      void CapacitorApp.exitApp();
    }).then((registeredListener) => {
      if (cancelled) {
        void registeredListener.remove();
      } else {
        listener = registeredListener;
      }
    });

    return () => {
      cancelled = true;
      if (listener) void listener.remove();
    };
  }, []);

  return null;
}

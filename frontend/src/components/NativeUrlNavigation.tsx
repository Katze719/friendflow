import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { resetToDefaultInstance } from "../lib/instances";
import { friendflowRouterTarget } from "../lib/nativeLinks";

export default function NativeUrlNavigation() {
  const navigate = useNavigate();
  const lastHandledUrl = useRef<{ url: string; at: number } | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let listener: PluginListenerHandle | undefined;

    const openUrl = (rawUrl: string) => {
      const now = Date.now();
      if (
        cancelled ||
        (lastHandledUrl.current?.url === rawUrl &&
          now - lastHandledUrl.current.at < 1_000)
      ) {
        return;
      }
      const target = friendflowRouterTarget(rawUrl);
      if (!target) return;

      // iOS/Android can report the same cold-start URL via appUrlOpen and
      // getLaunchUrl. Suppress only that short duplicate; opening the same URL
      // again later must still navigate.
      lastHandledUrl.current = { url: rawUrl, at: now };
      // Incoming official links always belong to the official/default
      // instance. Per-instance tokens and caches remain stored.
      resetToDefaultInstance();
      navigate(target, { replace: true });
    };

    void CapacitorApp.addListener("appUrlOpen", ({ url }) => {
      openUrl(url);
    }).then((registeredListener) => {
      if (cancelled) {
        void registeredListener.remove();
      } else {
        listener = registeredListener;
      }
    });

    // appUrlOpen covers warm launches. getLaunchUrl also handles a cold start
    // reliably across both native platforms.
    void CapacitorApp.getLaunchUrl().then((launch) => {
      if (launch?.url) openUrl(launch.url);
    });

    return () => {
      cancelled = true;
      if (listener) void listener.remove();
    };
  }, [navigate]);

  return null;
}

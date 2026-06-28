import { useEffect, useState } from "react";
import type { AuthConfig } from "../api/types";
import { fetchAuthConfigForBaseUrl, useActiveInstance } from "./instances";

/**
 * Fetches `/api/auth/config` once per page and hands back the tiny
 * public config object. Falls back to `null` on errors so callers can
 * render a best-effort UI while the backend is unreachable - the auth
 * flow itself still works, users just don't see the "forgot password"
 * link or the private/public instance badge.
 */
export function useAuthConfig(): AuthConfig | null {
  const instance = useActiveInstance();
  const [cfg, setCfg] = useState<AuthConfig | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setCfg(null);
    fetchAuthConfigForBaseUrl(instance.baseUrl, controller.signal)
      .then((c) => setCfg(c))
      .catch(() => {
        /* offline / old backend - leave null */
      });
    return () => controller.abort();
  }, [instance.baseUrl, instance.kind]);

  return cfg;
}

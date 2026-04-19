/**
 * Controls what an unauthenticated visitor sees at `/`.
 *
 * The value is read from `VITE_LANDING_MODE` at build time (wired through
 * docker-compose as the `LANDING_MODE` variable). Vite inlines the value,
 * so there is no runtime cost.
 *
 *   "login"   -> redirect straight to the sign-in form (the old behaviour).
 *   "landing" -> render the public marketing page with sign-in / sign-up
 *               buttons in the top right. Useful when the instance is
 *               exposed to the open web and you want to explain what
 *               friendflow is before asking people to log in.
 */
export type LandingMode = "login" | "landing";

export function getLandingMode(): LandingMode {
  const raw = (import.meta.env.VITE_LANDING_MODE ?? "").toString().trim().toLowerCase();
  return raw === "landing" ? "landing" : "login";
}

export function isLandingModeEnabled(): boolean {
  return getLandingMode() === "landing";
}

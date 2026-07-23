const OFFICIAL_APP_HOST = "friendflow.site";

/**
 * Converts a verified friendflow.site HTTPS URL into an in-app router target.
 * Keeping this parser strict prevents arbitrary external URLs delivered by the
 * native bridge from being treated as trusted application navigation.
 */
export function friendflowRouterTarget(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (
      url.protocol !== "https:" ||
      url.hostname.toLowerCase() !== OFFICIAL_APP_HOST ||
      url.port ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return `${url.pathname || "/"}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

import { getInstanceStorageKey } from "./instances";

const ONBOARDING_DISMISSED_SLOT = "onboarding.dismissed";

function storageKey(): string {
  return getInstanceStorageKey(ONBOARDING_DISMISSED_SLOT);
}

export function isOnboardingDismissed(): boolean {
  try {
    return localStorage.getItem(storageKey()) === "1";
  } catch {
    return false;
  }
}

export function dismissOnboarding(): void {
  try {
    localStorage.setItem(storageKey(), "1");
  } catch {
    /* storage may be unavailable */
  }
}

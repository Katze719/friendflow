export interface AppUpdateRequiredPayload {
  minimum_supported_app_version?: string;
  latest_app_version?: string;
  message?: string;
}

const eventTarget = new EventTarget();
const UPDATE_REQUIRED_EVENT = "app-update-required";

export function emitAppUpdateRequired(payload: AppUpdateRequiredPayload): void {
  eventTarget.dispatchEvent(
    new CustomEvent<AppUpdateRequiredPayload>(UPDATE_REQUIRED_EVENT, {
      detail: payload,
    }),
  );
}

export function subscribeAppUpdateRequired(
  listener: (payload: AppUpdateRequiredPayload) => void,
): () => void {
  const handler = (event: Event) => {
    listener((event as CustomEvent<AppUpdateRequiredPayload>).detail);
  };
  eventTarget.addEventListener(UPDATE_REQUIRED_EVENT, handler);
  return () => eventTarget.removeEventListener(UPDATE_REQUIRED_EVENT, handler);
}

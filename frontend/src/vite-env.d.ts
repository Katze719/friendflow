/// <reference types="vite/client" />

declare module "*?raw" {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_LANDING_MODE?: "login" | "landing";
  readonly VITE_DEFAULT_INSTANCE_URL?: string;
  readonly VITE_DEFAULT_INSTANCE_LABEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;

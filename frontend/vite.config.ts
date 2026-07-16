import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { version } from "./package.json";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

function resolveAppVersion(): string {
  const envVersion = process.env.VITE_APP_VERSION?.trim();
  if (envVersion) {
    return envVersion;
  }

  try {
    const gitArgs = ["describe", "--tags", "--always"];
    const isCiBuild =
      process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
    if (!isCiBuild) {
      gitArgs.push("--dirty");
    }

    return execFileSync("git", gitArgs, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return version;
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(resolveAppVersion()),
  },
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});

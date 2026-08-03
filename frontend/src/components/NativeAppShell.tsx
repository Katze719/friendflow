import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { Keyboard, type KeyboardInfo } from "@capacitor/keyboard";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

const EDITABLE_SELECTOR =
  'input:not([type="button"]):not([type="checkbox"]):not([type="hidden"]):not([type="radio"]):not([type="reset"]):not([type="submit"]), select, textarea, [contenteditable="true"]';

function setKeyboardState(open: boolean, info?: KeyboardInfo) {
  const root = document.documentElement;
  if (open) {
    root.dataset.keyboardOpen = "true";
    root.style.setProperty(
      "--keyboard-height",
      `${Math.max(0, info?.keyboardHeight ?? 0)}px`,
    );
  } else {
    delete root.dataset.keyboardOpen;
    root.style.removeProperty("--keyboard-height");
  }
}

function revealFocusedControl() {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !active.matches(EDITABLE_SELECTOR)) return;

  const viewport = window.visualViewport;
  const viewportTop = viewport?.offsetTop ?? 0;
  const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
  const rect = active.getBoundingClientRect();
  const breathingRoom = 16;

  if (
    rect.top < viewportTop + breathingRoom ||
    rect.bottom > viewportBottom - breathingRoom
  ) {
    active.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
  }
}

export default function NativeAppShell() {
  const { resolved } = useTheme();
  const native = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!native) return;

    const syncStatusBar = () => {
      // Capacitor's enum names describe the background style: Dark produces
      // light icons, Light produces dark icons.
      void StatusBar.setStyle({
        style: resolved === "dark" ? Style.Dark : Style.Light,
      }).catch(() => {});
    };

    syncStatusBar();
    let appStateHandle: PluginListenerHandle | undefined;
    let cancelled = false;

    void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) syncStatusBar();
    }).then((handle) => {
      if (cancelled) void handle.remove();
      else appStateHandle = handle;
    });

    return () => {
      cancelled = true;
      if (appStateHandle) void appStateHandle.remove();
    };
  }, [native, resolved]);

  useEffect(() => {
    if (!native) return;

    let cancelled = false;
    const handles: PluginListenerHandle[] = [];
    const keep = (handle: PluginListenerHandle) => {
      if (cancelled) void handle.remove();
      else handles.push(handle);
    };

    void Keyboard.addListener("keyboardWillShow", (info) => {
      setKeyboardState(true, info);
    }).then(keep);
    void Keyboard.addListener("keyboardDidShow", (info) => {
      setKeyboardState(true, info);
      // Wait for the native WebView resize and React layout to settle before
      // deciding whether the focused field is actually obscured.
      requestAnimationFrame(() => requestAnimationFrame(revealFocusedControl));
    }).then(keep);
    void Keyboard.addListener("keyboardWillHide", () => {
      setKeyboardState(false);
    }).then(keep);
    void Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardState(false);
    }).then(keep);

    return () => {
      cancelled = true;
      setKeyboardState(false);
      for (const handle of handles) void handle.remove();
    };
  }, [native]);

  return null;
}

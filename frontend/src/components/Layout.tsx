import { Home, LogOut, RefreshCw, Settings, Shield, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { adminApi } from "../api/admin";
import { useAuth } from "../context/AuthContext";
import { useAppCompatibility } from "../lib/appCompatibility";
import HeaderMenu from "./HeaderMenu";
import InstallAppButton from "./InstallAppButton";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileBottomNav from "./MobileBottomNav";
import ThemeSwitcher from "./ThemeSwitcher";

const PENDING_POLL_MS = 60_000;

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const compatibility = useAppCompatibility();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const isAdmin = !!user?.is_admin;
  const [pendingCount, setPendingCount] = useState(0);
  const [updateBannerDismissed, setUpdateBannerDismissed] = useState(false);
  const isNativeApp = compatibility.platform !== "web";
  const availableUpdateMessage =
    compatibility.info?.message ??
    (compatibility.platform === "ios"
      ? t("appUpdate.available.pendingIos")
      : compatibility.platform === "android"
        ? t("appUpdate.available.pendingAndroid")
        : t("appUpdate.available.body", {
            version: compatibility.info?.latest_app_version ?? "",
          }));
  // Hide the shortcut on the dashboard itself - otherwise the primary
  // CTA would just take you to the page you're already on.
  const onDashboard = location.pathname === "/";

  useEffect(() => {
    if (!isAdmin) {
      setPendingCount(0);
      return;
    }
    let cancelled = false;
    const load = () => {
      adminApi
        .listUsers("pending")
        .then((rows) => {
          if (!cancelled) setPendingCount(rows.length);
        })
        .catch(() => {});
    };
    load();
    const interval = window.setInterval(load, PENDING_POLL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") load();
    };
    const onChanged = () => load();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", load);
    window.addEventListener("admin:pending-changed", onChanged);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", load);
      window.removeEventListener("admin:pending-changed", onChanged);
    };
  }, [isAdmin]);

  return (
    <div className="flex min-h-full w-full min-w-0 max-w-full flex-col overflow-x-clip">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur pt-safe dark:border-slate-800/70 dark:bg-slate-950/70">
        <div className="mx-auto flex w-full min-w-0 max-w-5xl items-center justify-between gap-2 px-safe py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Link
              to="/"
              className="flex min-w-0 items-center gap-2 font-semibold text-slate-900 dark:text-slate-100"
            >
              <img
                src="/favicon-192.png"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 rounded-lg"
              />
              <span className="truncate">friendflow</span>
            </Link>
            {user && !onDashboard && (
              <Link
                to="/"
                className="btn-primary ml-1 shrink-0"
                aria-label={t("layout.dashboard")}
                title={t("layout.dashboard")}
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {t("layout.dashboard")}
                </span>
              </Link>
            )}
          </div>
          <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-3">
            <InstallAppButton
              variant="ghost"
              className="h-10 w-10 shrink-0 p-0 [&>span]:hidden sm:h-auto sm:w-auto sm:px-4 sm:py-2 sm:[&>span]:inline"
            />
            <div className="hidden items-center gap-3 sm:flex">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>
            {isAdmin && (
              <Link
                to="/admin/users"
                className="btn-ghost relative h-10 w-10 shrink-0 p-0 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
                aria-label={
                  pendingCount > 0
                    ? t("layout.adminWithPending", { count: pendingCount })
                    : t("layout.admin")
                }
                title={
                  pendingCount > 0
                    ? t("layout.adminWithPending", { count: pendingCount })
                    : t("layout.admin")
                }
              >
                <span className="relative inline-flex">
                  <Shield className="h-4 w-4" />
                  {pendingCount > 0 && (
                    <span
                      className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white dark:ring-slate-950"
                      aria-hidden="true"
                    >
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  )}
                </span>
                <span className="hidden sm:inline">{t("layout.admin")}</span>
              </Link>
            )}
            {user && (
              <>
                <Link
                  to="/me/settings"
                  className="btn-ghost h-10 w-10 shrink-0 p-0 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
                  aria-label={t("layout.account")}
                  title={t("layout.account")}
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("layout.account")}</span>
                </Link>
                <span className="hidden text-sm text-slate-600 dark:text-slate-300 md:inline">
                  {user.display_name}
                </span>
                <button
                  className="btn-ghost h-10 w-10 shrink-0 p-0 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
                  onClick={() => {
                    logout();
                    navigate("/login", { replace: true });
                  }}
                  aria-label={t("layout.signOut")}
                  title={t("layout.signOut")}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("layout.signOut")}</span>
                </button>
              </>
            )}
            <HeaderMenu />
          </div>
        </div>
      </header>
      {compatibility.status === "update_available" && !updateBannerDismissed && (
        <div className="border-b border-amber-200 bg-amber-50 px-safe py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
            <span>{availableUpdateMessage}</span>
            <div className="flex items-center gap-1">
              {compatibility.updateUrl ? (
                <a
                  className="btn-ghost h-8 px-2 text-xs"
                  href={compatibility.updateUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {compatibility.platform === "ios"
                    ? t("appUpdate.checkIosAction")
                    : t("appUpdate.checkAndroidAction")}
                </a>
              ) : !isNativeApp ? (
                <button
                  className="btn-ghost h-8 px-2 text-xs"
                  type="button"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t("appUpdate.reloadAction")}
                </button>
              ) : null}
              <button
                className="btn-ghost h-8 px-2 text-xs"
                type="button"
                onClick={() => setUpdateBannerDismissed(true)}
                aria-label={t("common.dismiss")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 px-safe py-6 pb-[calc(96px+env(safe-area-inset-bottom))] sm:pb-6">
        {children}
      </main>
      <footer className="hidden border-t border-slate-200/70 bg-white/60 pb-safe dark:border-slate-800/70 dark:bg-slate-950/60 sm:block">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-safe py-3 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between dark:text-slate-400">
          <span>
            {t("layout.footer")}
            <span className="ml-2 text-slate-400 dark:text-slate-500">
              {__APP_VERSION__}
            </span>
          </span>
          <nav className="flex flex-wrap gap-x-4 gap-y-1">
            <Link
              to="/privacy"
              className="hover:text-slate-800 dark:hover:text-slate-200"
            >
              {t("legal.privacyPolicy")}
            </Link>
            <Link
              to="/support"
              className="hover:text-slate-800 dark:hover:text-slate-200"
            >
              {t("legal.support")}
            </Link>
            <Link
              to="/account-deletion"
              className="hover:text-slate-800 dark:hover:text-slate-200"
            >
              {t("legal.accountDeletion")}
            </Link>
            <Link
              to="/terms"
              className="hover:text-slate-800 dark:hover:text-slate-200"
            >
              {t("legal.termsOfService")}
            </Link>
          </nav>
        </div>
      </footer>
      {user && <MobileBottomNav />}
    </div>
  );
}

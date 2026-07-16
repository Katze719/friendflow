import { LogOut, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppCompatibility } from "../lib/appCompatibility";
import InstanceSwitcher from "./InstanceSwitcher";

export default function AppUpdateRequired() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const compatibility = useAppCompatibility();
  const minimumVersion = compatibility.info?.minimum_supported_app_version;
  const latestVersion = compatibility.info?.latest_app_version;
  const isNativeApp = compatibility.platform !== "web";
  const message =
    compatibility.info?.message ??
    (compatibility.platform === "ios"
      ? t("appUpdate.available.pendingIos")
      : compatibility.platform === "android"
        ? t("appUpdate.available.pendingAndroid")
        : t("appUpdate.required.body"));

  return (
    <div className="flex min-h-full flex-col bg-slate-50 px-safe py-[max(2rem,env(safe-area-inset-top))] dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center">
        <div className="mb-6 flex flex-col items-center gap-3 text-slate-900 dark:text-slate-100">
          <img
            src="/favicon-192.png"
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10"
          />
          <span className="text-xl font-semibold tracking-tight">friendflow</span>
        </div>

        <section className="card space-y-5 p-6 text-center sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            <RefreshCw className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("appUpdate.required.title")}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {message}
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm dark:border-slate-700 dark:bg-slate-950/40 sm:grid-cols-2">
            <div>
              <dt className="label">{t("appUpdate.currentVersion")}</dt>
              <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                {compatibility.clientVersion}
              </dd>
            </div>
            <div>
              <dt className="label">{t("appUpdate.requiredVersion")}</dt>
              <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                {minimumVersion || latestVersion || t("appUpdate.unknownVersion")}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2">
            {compatibility.updateUrl ? (
              <a
                className="btn-primary w-full"
                href={compatibility.updateUrl}
                target="_blank"
                rel="noreferrer"
              >
                <RefreshCw className="h-4 w-4" />
                {compatibility.platform === "ios"
                  ? t("appUpdate.checkIosAction")
                  : t("appUpdate.checkAndroidAction")}
              </a>
            ) : !isNativeApp ? (
              <button
                className="btn-primary w-full"
                type="button"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4" />
                {t("appUpdate.reloadAction")}
              </button>
            ) : null}
            <div className="flex flex-wrap justify-center gap-2">
              <InstanceSwitcher />
              <button
                className="btn-ghost"
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
              >
                <LogOut className="h-4 w-4" />
                {t("layout.signOut")}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import {
  FileText,
  Globe2,
  Info,
  KeyRound,
  LogOut,
  Palette,
  Shield,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { accountApi } from "../api/account";
import { adminApi } from "../api/admin";
import AccentSwitcher from "../components/AccentSwitcher";
import InstallAppButton from "../components/InstallAppButton";
import LanguageSwitcher from "../components/LanguageSwitcher";
import PageHeader from "../components/PageHeader";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useConfirm, useToast } from "../ui/UIProvider";

export default function AccountSettings() {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { user, logout, setCurrentUser } = useAuth();
  const { showHeaderIcon, setShowHeaderIcon } = useTheme();

  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [profileBusy, setProfileBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user?.is_admin) return;
    let cancelled = false;
    adminApi
      .listUsers("pending")
      .then((rows) => {
        if (!cancelled) setPendingCount(rows.length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.is_admin]);

  async function onProfileSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || profileBusy) return;

    const trimmed = displayName.trim();
    if (trimmed.length < 2) {
      toast.error(t("account.profile.errors.displayNameShort"));
      return;
    }

    setProfileBusy(true);
    try {
      const next = await accountApi.updateProfile(trimmed);
      setCurrentUser(next);
      setDisplayName(next.display_name);
      toast.success(t("account.profile.saved"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setProfileBusy(false);
    }
  }

  async function onPasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (passwordBusy) return;
    if (newPassword.length < 8) {
      toast.error(t("auth.reset.errorShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("auth.reset.errorMismatch"));
      return;
    }

    setPasswordBusy(true);
    try {
      await accountApi.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(t("account.password.saved"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setPasswordBusy(false);
    }
  }

  async function onDeleteSubmit(e: FormEvent) {
    e.preventDefault();
    if (deleteBusy) return;
    if (!deletePassword.trim()) {
      toast.error(t("account.delete.errors.passwordRequired"));
      return;
    }

    const ok = await confirm({
      title: t("account.delete.confirmTitle"),
      message: t("account.delete.confirmBody"),
      confirmLabel: t("account.delete.submit"),
      cancelLabel: t("common.cancel"),
      variant: "danger",
    });
    if (!ok) return;

    setDeleteBusy(true);
    try {
      await accountApi.deleteAccount(deletePassword);
      logout();
      navigate("/login", { replace: true });
      toast.success(t("account.delete.deleted"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6" data-testid="settings-hub">
      <PageHeader
        backLink={{ to: "/", label: t("layout.backToDashboard") }}
        title={t("account.title")}
        subtitle={t("account.subtitle")}
      />

      <section className="card space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">{t("account.profile.title")}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("account.profile.subtitle")}
            </p>
          </div>
        </div>

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={onProfileSubmit}>
          <div className="space-y-1">
            <label className="label" htmlFor="account_email">
              {t("auth.fields.email")}
            </label>
            <input
              id="account_email"
              type="email"
              className="input"
              value={user?.email ?? ""}
              disabled
            />
          </div>
          <div className="space-y-1">
            <label className="label" htmlFor="account_display_name">
              {t("auth.fields.displayName")}
            </label>
            <input
              id="account_display_name"
              type="text"
              minLength={2}
              maxLength={64}
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" className="btn-primary" disabled={profileBusy}>
              {profileBusy ? t("common.saving") : t("account.profile.submit")}
            </button>
          </div>
        </form>
      </section>

      <section className="card space-y-6 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            <Palette className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">{t("account.preferences.title")}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("account.preferences.subtitle")}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="label">{t("theme.mode")}</h3>
          <ThemeSwitcher full />
        </div>
        <div className="space-y-3">
          <h3 className="label">{t("theme.accent")}</h3>
          <AccentSwitcher />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {t("theme.headerIcon.title")}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("theme.headerIcon.subtitle")}
            </p>
          </div>
          <button
            data-testid="header-icon-toggle"
            type="button"
            role="switch"
            aria-checked={showHeaderIcon}
            aria-label={t("theme.headerIcon.title")}
            onClick={() => setShowHeaderIcon(!showHeaderIcon)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
              showHeaderIcon ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`absolute left-0 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                showHeaderIcon ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <div className="space-y-3">
          <h3 className="label inline-flex items-center gap-2">
            <Globe2 className="h-4 w-4" />
            {t("common.language")}
          </h3>
          <LanguageSwitcher full />
        </div>
      </section>

      <section className="card space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
            <Shield className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">{t("account.access.title")}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("account.access.subtitle")}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <InstallAppButton variant="ghost" className="min-h-12 justify-start border border-slate-200 dark:border-slate-700" />
          {user?.is_admin ? (
            <Link
              to="/admin/users"
              className="btn-ghost min-h-12 justify-between border border-slate-200 dark:border-slate-700"
            >
              <span className="inline-flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t("layout.admin")}
              </span>
              {pendingCount > 0 ? (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              ) : null}
            </Link>
          ) : null}
          <button
            type="button"
            className="btn-ghost min-h-12 justify-start border border-slate-200 dark:border-slate-700"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            <LogOut className="h-4 w-4" />
            {t("layout.signOut")}
          </button>
        </div>
      </section>

      <section className="card space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">{t("account.password.title")}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("account.password.subtitle")}
            </p>
          </div>
        </div>

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={onPasswordSubmit}>
          <div className="space-y-1 sm:col-span-2">
            <label className="label" htmlFor="current_password">
              {t("account.password.current")}
            </label>
            <input
              id="current_password"
              type="password"
              autoComplete="current-password"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="label" htmlFor="new_password">
              {t("auth.reset.newPassword")}
            </label>
            <input
              id="new_password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("auth.register.passwordHint")}
            </p>
          </div>
          <div className="space-y-1">
            <label className="label" htmlFor="confirm_password">
              {t("auth.reset.confirmPassword")}
            </label>
            <input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" className="btn-primary" disabled={passwordBusy}>
              {passwordBusy ? t("common.saving") : t("account.password.submit")}
            </button>
          </div>
        </form>
      </section>

      <section className="card space-y-5 border-rose-200/70 p-5 sm:p-6 dark:border-rose-900/60">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <Trash2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">{t("account.delete.title")}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("account.delete.subtitle")}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-100">
          {t("account.delete.warning")}
        </div>

        <form className="space-y-4" onSubmit={onDeleteSubmit}>
          <div className="space-y-1">
            <label className="label" htmlFor="delete_password">
              {t("account.delete.password")}
            </label>
            <input
              id="delete_password"
              type="password"
              autoComplete="current-password"
              className="input"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-danger" disabled={deleteBusy}>
              {deleteBusy ? t("common.saving") : t("account.delete.submit")}
            </button>
          </div>
        </form>
      </section>

      <section className="card space-y-4 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Info className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">{t("account.about.title")}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("account.about.subtitle", { version: __APP_VERSION__ })}
            </p>
          </div>
        </div>

        <nav className="grid gap-2 sm:grid-cols-4" aria-label={t("account.about.title")}>
          <LegalLink to="/privacy" label={t("legal.privacyPolicy")} />
          <LegalLink to="/support" label={t("legal.support")} />
          <LegalLink to="/account-deletion" label={t("legal.accountDeletion")} />
          <LegalLink to="/terms" label={t("legal.termsOfService")} />
        </nav>
      </section>
    </div>
  );
}

function LegalLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <span className="inline-flex min-w-0 items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="truncate">{label}</span>
      </span>
    </Link>
  );
}

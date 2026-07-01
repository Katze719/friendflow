import {
  CalendarRange,
  ClipboardList,
  Home,
  Settings,
  ShoppingBasket,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

export default function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  const items = [
    {
      to: "/",
      label: t("mobileNav.home"),
      icon: Home,
      active: location.pathname === "/",
    },
    {
      to: "/me/calendar",
      label: t("mobileNav.calendar"),
      icon: CalendarRange,
      active: location.pathname.startsWith("/me/calendar"),
    },
    {
      to: "/me/shopping",
      label: t("mobileNav.shopping"),
      icon: ShoppingBasket,
      active: location.pathname.startsWith("/me/shopping"),
    },
    {
      to: "/me/tasks",
      label: t("mobileNav.tasks"),
      icon: ClipboardList,
      active: location.pathname.startsWith("/me/tasks"),
    },
    {
      to: "/me/settings",
      label: t("mobileNav.account"),
      icon: Settings,
      active: location.pathname === "/me/settings",
    },
  ];

  return (
    <nav
      aria-label={t("mobileNav.aria")}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 px-safe pb-safe shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden dark:border-slate-800/80 dark:bg-slate-950/95"
    >
      <div className="grid h-16 grid-cols-5">
        {items.map(({ to, label, icon: Icon, active }) => (
          <Link
            key={to}
            to={to}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
              active
                ? "text-brand-600 dark:text-brand-400"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <span
              className={`inline-flex h-8 w-10 items-center justify-center rounded-full ${
                active
                  ? "bg-brand-50 dark:bg-brand-900/40"
                  : "bg-transparent"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="max-w-full truncate px-1">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

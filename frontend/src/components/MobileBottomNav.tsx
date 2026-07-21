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
      label: t("mobileNav.settings"),
      icon: Settings,
      active: location.pathname === "/me/settings",
    },
  ];

  return (
    <nav
      data-testid="mobile-bottom-nav"
      aria-label={t("mobileNav.aria")}
      className="fixed bottom-0 left-0 right-auto z-30 w-screen max-w-full overflow-hidden border-t border-slate-200/80 bg-white/95 px-safe pb-safe shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden dark:border-slate-800/80 dark:bg-slate-950/95"
    >
      <div className="grid h-[64px] min-w-0 grid-cols-5">
        {items.map(({ to, label, icon: Icon, active }) => (
          <Link
            key={to}
            to={to}
            title={label}
            className={`flex min-w-0 max-w-full flex-col items-center justify-center gap-[4px] overflow-hidden text-[11px] font-medium transition ${
              active
                ? "text-brand-600 dark:text-brand-400"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <span
              className={`inline-flex h-[32px] w-[40px] shrink-0 items-center justify-center rounded-full ${
                active
                  ? "bg-brand-50 dark:bg-brand-900/40"
                  : "bg-transparent"
              }`}
            >
              <Icon className="h-[16px] w-[16px]" />
            </span>
            <span className="block w-full min-w-0 truncate px-[4px] text-center leading-none">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

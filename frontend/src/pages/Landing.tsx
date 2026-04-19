import {
  ArrowRight,
  CalendarDays,
  Check,
  Github,
  Globe,
  Lock,
  type LucideIcon,
  Plane,
  Server,
  Share2,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import InstallAppButton from "../components/InstallAppButton";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ThemeSwitcher from "../components/ThemeSwitcher";

const GITHUB_URL = "https://github.com/Katze719/friendflow";
const LICENSE_URL = "https://github.com/Katze719/friendflow/blob/main/LICENSE";

/**
 * Public marketing / intro page shown to unauthenticated visitors when
 * `VITE_LANDING_MODE=landing` is set. The top-right CTAs go straight to
 * the real login/register pages so existing users always have a one-click
 * path in.
 */
export default function Landing() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-full overflow-x-clip bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <BackgroundDecor />

      <Header />

      <main className="relative">
        <Hero />
        <TrustBar />
        <Features />
        <HowItWorks />
        <Values />
        <Faq />
        <FinalCta />
      </main>

      <footer className="relative border-t border-slate-200/70 bg-white/60 dark:border-slate-800/70 dark:bg-slate-950/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-safe py-6 text-xs text-slate-500 sm:flex-row dark:text-slate-400">
          <span>{t("layout.footer")}</span>
          <div className="flex items-center gap-4">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <Github className="h-3.5 w-3.5" />
              {t("landing.nav.github")}
            </a>
            <a
              href={LICENSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 dark:hover:text-slate-100"
              title={t("landing.license.tooltip")}
            >
              {t("landing.license.short")}
            </a>
            <Link to="/login" className="hover:text-slate-900 dark:hover:text-slate-100">
              {t("landing.nav.signIn")}
            </Link>
            <Link to="/register" className="hover:text-slate-900 dark:hover:text-slate-100">
              {t("landing.nav.signUp")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BackgroundDecor() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] overflow-hidden"
      >
        <div className="absolute -top-32 left-1/2 h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-400/30 via-sky-300/20 to-fuchsia-300/20 blur-3xl dark:from-brand-500/25 dark:via-sky-500/15 dark:to-fuchsia-500/10" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(ellipse_at_top,theme(colors.slate.200/0.6),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,theme(colors.slate.800/0.4),transparent_60%)]"
      />
    </>
  );
}

function Header() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/70 backdrop-blur pt-safe dark:border-slate-800/60 dark:bg-slate-950/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-safe py-3">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100"
        >
          <img
            src="/favicon-192.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg"
          />
          <span>friendflow</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden items-center gap-1 sm:flex">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-sm"
            aria-label={t("landing.nav.github")}
            title={t("landing.nav.github")}
          >
            <Github className="h-4 w-4" />
            <span className="hidden md:inline">{t("landing.nav.github")}</span>
          </a>
          <Link
            to="/login"
            className="btn-ghost text-sm"
            aria-label={t("landing.nav.signIn")}
          >
            {t("landing.nav.signIn")}
          </Link>
          <Link
            to="/register"
            className="btn-primary text-sm"
            aria-label={t("landing.nav.signUp")}
          >
            {t("landing.nav.signUp")}
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-6xl px-safe pt-14 pb-10 sm:pt-20 sm:pb-16">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200/70 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-800/60 dark:bg-brand-900/30 dark:text-brand-200">
            <Sparkles className="h-3.5 w-3.5" />
            {t("landing.hero.eyebrow")}
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {t("landing.hero.title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            {t("landing.hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/register" className="btn-primary px-5 py-2.5 text-base">
              {t("landing.hero.ctaPrimary")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="btn-secondary px-5 py-2.5 text-base">
              {t("landing.hero.ctaSecondary")}
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost px-4 py-2.5 text-base"
              aria-label={t("landing.hero.ctaGithub")}
            >
              <Github className="h-4 w-4" />
              {t("landing.hero.ctaGithub")}
            </a>
            <InstallAppButton variant="ghost" />
          </div>
          <ul className="mt-8 grid max-w-xl gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
            {(["bullet1", "bullet2", "bullet3", "bullet4"] as const).map((k) => (
              <li key={k} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{t(`landing.hero.${k}`)}</span>
              </li>
            ))}
          </ul>
        </div>
        <HeroMock />
      </div>
    </section>
  );
}

/**
 * Stylised, static product "screenshot" built in pure CSS so the landing
 * page ships no marketing binaries and adapts to dark mode automatically.
 */
function HeroMock() {
  const { t } = useTranslation();
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-400/30 via-sky-400/20 to-fuchsia-400/20 blur-2xl dark:from-brand-500/20 dark:via-sky-500/15 dark:to-fuchsia-500/15"
      />
      <div className="card overflow-hidden p-0 shadow-xl ring-slate-200/50 dark:ring-slate-700/40">
        <div className="flex items-center gap-1.5 border-b border-slate-200/70 bg-slate-50 px-4 py-2.5 dark:border-slate-800/70 dark:bg-slate-900/80">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 truncate text-xs text-slate-500 dark:text-slate-400">
            friendflow / lisbon-crew
          </span>
        </div>
        <div className="space-y-3 p-5">
          <MockRow
            icon={Plane}
            accent="bg-sky-500"
            title={t("landing.mock.trip.title")}
            subtitle={t("landing.mock.trip.subtitle")}
          />
          <MockRow
            icon={Wallet}
            accent="bg-emerald-500"
            title={t("landing.mock.split.title")}
            subtitle={t("landing.mock.split.subtitle")}
            amount="€ 138,40"
          />
          <MockRow
            icon={CalendarDays}
            accent="bg-violet-500"
            title={t("landing.mock.calendar.title")}
            subtitle={t("landing.mock.calendar.subtitle")}
          />
          <MockRow
            icon={ShoppingBasket}
            accent="bg-amber-500"
            title={t("landing.mock.shopping.title")}
            subtitle={t("landing.mock.shopping.subtitle")}
          />
        </div>
      </div>
    </div>
  );
}

function MockRow({
  icon: Icon,
  accent,
  title,
  subtitle,
  amount,
}: {
  icon: LucideIcon;
  accent: string;
  title: string;
  subtitle: string;
  amount?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/70 p-3 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${accent}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      {amount && (
        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          {amount}
        </span>
      )}
    </div>
  );
}

function TrustBar() {
  const { t } = useTranslation();
  const items: { icon: LucideIcon; key: string }[] = [
    { icon: Lock, key: "privacy" },
    { icon: Server, key: "selfHosted" },
    { icon: Smartphone, key: "pwa" },
    { icon: Globe, key: "multiLang" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-safe pb-4">
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200/70 bg-white/60 p-4 text-sm text-slate-600 sm:grid-cols-4 dark:border-slate-800/70 dark:bg-slate-900/50 dark:text-slate-300">
        {items.map(({ icon: Icon, key }) => (
          <div key={key} className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span>{t(`landing.trust.${key}`)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const { t } = useTranslation();
  const features: { id: string; icon: LucideIcon; accent: string }[] = [
    { id: "splitwise", icon: Wallet, accent: "bg-emerald-500" },
    { id: "trips", icon: Plane, accent: "bg-sky-500" },
    { id: "calendar", icon: CalendarDays, accent: "bg-violet-500" },
    { id: "shopping", icon: ShoppingBasket, accent: "bg-amber-500" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-safe py-16 sm:py-20">
      <SectionHeading
        eyebrow={t("landing.features.eyebrow")}
        title={t("landing.features.title")}
        subtitle={t("landing.features.subtitle")}
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ id, icon: Icon, accent }) => (
          <div
            key={id}
            className="card flex h-full flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-white ${accent}`}>
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-semibold">{t(`landing.features.${id}.title`)}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t(`landing.features.${id}.body`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const { t } = useTranslation();
  const steps: { icon: LucideIcon; id: string }[] = [
    { icon: Users, id: "step1" },
    { icon: Share2, id: "step2" },
    { icon: Sparkles, id: "step3" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-safe py-16 sm:py-20">
      <SectionHeading
        eyebrow={t("landing.how.eyebrow")}
        title={t("landing.how.title")}
        subtitle={t("landing.how.subtitle")}
      />
      <ol className="mt-10 grid gap-4 sm:grid-cols-3">
        {steps.map(({ icon: Icon, id }, i) => (
          <li
            key={id}
            className="card relative flex h-full flex-col gap-3 p-5"
          >
            <span className="absolute -top-3 left-5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white shadow ring-4 ring-white dark:ring-slate-950">
              {i + 1}
            </span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-semibold">{t(`landing.how.${id}.title`)}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t(`landing.how.${id}.body`)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Values() {
  const { t } = useTranslation();
  const items: { icon: LucideIcon; id: string }[] = [
    { icon: Lock, id: "privacy" },
    { icon: Server, id: "selfHosted" },
    { icon: Smartphone, id: "pwa" },
    { icon: Globe, id: "open" },
  ];
  return (
    <section className="relative border-y border-slate-200/70 bg-white/60 dark:border-slate-800/70 dark:bg-slate-900/40">
      <div className="mx-auto max-w-6xl px-safe py-16 sm:py-20">
        <SectionHeading
          eyebrow={t("landing.values.eyebrow")}
          title={t("landing.values.title")}
          subtitle={t("landing.values.subtitle")}
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, id }) => (
            <div key={id} className="flex flex-col gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/90 text-white dark:bg-white/10">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold">{t(`landing.values.${id}.title`)}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t(`landing.values.${id}.body`)}
              </p>
              {id === "selfHosted" && (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    <Github className="h-4 w-4" />
                    {t("landing.values.selfHosted.cta")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={LICENSE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                    title={t("landing.license.tooltip")}
                  >
                    {t("landing.license.short")}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const { t } = useTranslation();
  const ids = ["cost", "data", "mobile", "invite"] as const;
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-3xl px-safe py-16 sm:py-20">
      <SectionHeading
        eyebrow={t("landing.faq.eyebrow")}
        title={t("landing.faq.title")}
        subtitle={t("landing.faq.subtitle")}
        centered
      />
      <div className="mt-8 divide-y divide-slate-200/70 rounded-2xl border border-slate-200/70 bg-white/70 dark:divide-slate-800/70 dark:border-slate-800/70 dark:bg-slate-900/50">
        {ids.map((id, i) => {
          const isOpen = open === i;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900"
              aria-expanded={isOpen}
            >
              <div className="min-w-0">
                <p className="font-medium">{t(`landing.faq.${id}.q`)}</p>
                {isOpen && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {t(`landing.faq.${id}.a`)}
                  </p>
                )}
              </div>
              <span
                aria-hidden="true"
                className={`mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition dark:border-slate-700 dark:text-slate-400 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FinalCta() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-6xl px-safe pb-20">
      <div className="relative overflow-hidden rounded-3xl border border-brand-200/70 bg-gradient-to-br from-brand-600 to-brand-500 px-6 py-12 text-white shadow-xl sm:px-12 sm:py-16 dark:border-brand-800/60">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/20 blur-3xl"
        />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">
              {t("landing.finalCta.title")}
            </h2>
            <p className="mt-2 max-w-xl text-brand-50/90">
              {t("landing.finalCta.subtitle")}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow hover:bg-brand-50"
            >
              {t("landing.finalCta.ctaPrimary")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              {t("landing.finalCta.ctaSecondary")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  centered,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-base text-slate-600 dark:text-slate-300">{subtitle}</p>
    </div>
  );
}

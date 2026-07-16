import {
  ArrowRight,
  CalendarPlus,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  Compass,
  EyeOff,
  Plus,
  ShoppingBasket,
  UserPlus,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { groupsApi } from "../api/groups";
import type { GroupSummary } from "../api/types";
import LoadingState from "../components/LoadingState";
import { useAuth } from "../context/AuthContext";
import {
  dismissOnboarding,
  isOnboardingDismissed,
} from "../lib/onboarding";
import { readInstanceStorage, writeInstanceStorage } from "../lib/instances";
import { toolPath, tools } from "../tools";
import { useFavoriteTools } from "../tools/useFavoriteTools";
import { useToast } from "../ui/UIProvider";

/**
 * localStorage key for the cached groups list. Lets the dashboard paint the
 * group cards instantly on reload (stale-while-revalidate) instead of
 * showing the spinner for a full network round-trip every time.
 *
 * Kept in sync with `clearAuthCaches()` in AuthContext - if you add more
 * dashboard-level caches, clear them there too so logout doesn't leak
 * data across sessions.
 */
function readCachedGroups(): GroupSummary[] | null {
  try {
    const raw = readInstanceStorage("groups");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    // Loose structural check - if the shape evolves we'd rather drop the
    // cache than render with missing fields.
    for (const g of parsed) {
      if (
        !g ||
        typeof g !== "object" ||
        typeof (g as GroupSummary).id !== "string" ||
        typeof (g as GroupSummary).name !== "string"
      ) {
        return null;
      }
    }
    return parsed as GroupSummary[];
  } catch {
    return null;
  }
}

function writeCachedGroups(groups: GroupSummary[] | null): void {
  try {
    writeInstanceStorage("groups", groups ? JSON.stringify(groups) : null);
  } catch {
    /* ignore */
  }
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupSummary[] | null>(() =>
    readCachedGroups(),
  );
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [revealForm, setRevealForm] = useState(false);
  const formRegionRef = useRef<HTMLDivElement | null>(null);
  const [onboardingHidden, setOnboardingHidden] = useState(() =>
    isOnboardingDismissed(),
  );
  const { shortcuts } = useFavoriteTools();

  const firstName = user?.display_name.split(" ")[0] ?? "you";

  const reload = useCallback(() => {
    groupsApi
      .list()
      .then((list) => {
        setGroups(list);
        writeCachedGroups(list);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t("common.error")));
  }, [t]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!revealForm || (!showCreate && !showJoin)) return;
    formRegionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setRevealForm(false);
  }, [revealForm, showCreate, showJoin]);

  const hasOpenedTool = shortcuts.length > 0;
  const showOnboarding =
    !onboardingHidden && (groups === null || groups.length === 0 || !hasOpenedTool);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-brand-600 dark:text-brand-400">{t("dashboard.eyebrow")}</p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("dashboard.greeting", { name: firstName })}
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">{t("dashboard.subtitle")}</p>
          </div>
          <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto">
            <button
              className="btn-secondary min-w-0 sm:flex-none"
              onClick={() => {
                setShowJoin((v) => !v);
                setShowCreate(false);
              }}
            >
              <UserPlus className="h-4 w-4" /> {t("dashboard.join")}
            </button>
            <button
              className="btn-primary min-w-0 sm:flex-none"
              onClick={() => {
                setShowCreate((v) => !v);
                setShowJoin(false);
              }}
            >
              <Plus className="h-4 w-4" /> {t("dashboard.newGroup")}
            </button>
          </div>
        </div>
      </section>

      {showOnboarding && (
        <OnboardingPanel
          hasGroup={(groups?.length ?? 0) > 0}
          hasOpenedTool={hasOpenedTool}
          onCreate={() => {
            setShowCreate(true);
            setShowJoin(false);
          }}
          onDismiss={() => {
            dismissOnboarding();
            setOnboardingHidden(true);
          }}
        />
      )}

      {(showCreate || showJoin) && (
        <div ref={formRegionRef} className="scroll-mt-24">
          {showCreate && (
            <CreateGroupForm
              onDone={(created) => {
                setShowCreate(false);
                if (created) reload();
              }}
            />
          )}
          {showJoin && (
            <JoinGroupForm
              onDone={(joined) => {
                setShowJoin(false);
                if (joined) reload();
              }}
            />
          )}
        </div>
      )}

      {error && (
        <p className="alert-error">{error}</p>
      )}

      {groups && groups.length > 0 && shortcuts.length > 0 && (
        <ShortcutSection groups={groups} shortcuts={shortcuts} />
      )}

      <section id="groups" className="scroll-mt-24">
        <h2 className="mb-3 text-lg font-semibold">{t("dashboard.yourGroups")}</h2>
        {groups === null ? (
          <LoadingState compact />
        ) : groups.length === 0 ? (
          <EmptyState
            onCreate={() => {
              setShowCreate(true);
              setShowJoin(false);
              setRevealForm(true);
            }}
            onJoin={() => {
              setShowJoin(true);
              setShowCreate(false);
              setRevealForm(true);
            }}
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </ul>
        )}
      </section>

      <section id="personal-tools" className="scroll-mt-24">
        <h2 className="mb-3 text-lg font-semibold">
          {t("dashboard.personalTools")}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PersonalToolCard
            to="/me/calendar"
            title={t("layout.personalCalendar")}
            description={t("dashboard.personalCalendarDescription")}
            icon={<CalendarRange className="h-5 w-5" />}
            iconBg="bg-violet-500"
          />
          <PersonalToolCard
            to="/me/shopping"
            title={t("layout.personalShopping")}
            description={t("dashboard.personalShoppingDescription")}
            icon={<ShoppingBasket className="h-5 w-5" />}
            iconBg="bg-amber-500"
          />
          <PersonalToolCard
            to="/me/tasks"
            title={t("layout.personalTasks")}
            description={t("dashboard.personalTasksDescription")}
            icon={<ClipboardList className="h-5 w-5" />}
            iconBg="bg-emerald-500"
          />
          <PersonalToolCard
            to="/me/integrations/google-calendar"
            title={t("dashboard.googleCalendarTitle")}
            description={t("dashboard.googleCalendarDescription")}
            icon={<CalendarPlus className="h-5 w-5" />}
            iconBg="bg-blue-600"
            experimental
          />
        </ul>
      </section>
    </div>
  );
}

function ShortcutSection({
  groups,
  shortcuts,
}: {
  groups: GroupSummary[];
  shortcuts: ReturnType<typeof useFavoriteTools>["shortcuts"];
}) {
  const { t } = useTranslation();
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const items = shortcuts
    .map((item) => {
      const group = groupById.get(item.groupId);
      if (!group) return null;
      const tool = tools.find((candidate) => candidate.id === item.toolId);
      if (!tool) return null;
      return { item, group, tool };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .slice(0, 6);

  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("dashboard.shortcutsTitle")}</h2>
        <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
          {t("dashboard.shortcutsHint")}
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ item, group, tool }) => {
          const Icon = tool.icon ?? Compass;
          return (
            <li key={`${item.groupId}:${item.toolId}`}>
              <Link
                to={toolPath(group.id, tool)}
                className="card flex h-full items-start gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${tool.accent}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {t(tool.nameKey)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                    {group.name}
                  </span>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400">
                    {t("dashboard.open")} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function OnboardingPanel({
  hasGroup,
  hasOpenedTool,
  onCreate,
  onDismiss,
}: {
  hasGroup: boolean;
  hasOpenedTool: boolean;
  onCreate: () => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const steps = [
    { done: true, label: t("dashboard.onboarding.profile") },
    { done: hasGroup, label: t("dashboard.onboarding.group") },
    { done: hasOpenedTool, label: t("dashboard.onboarding.tool") },
  ];

  return (
    <section className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4 dark:border-brand-700/60 dark:bg-slate-900 dark:ring-1 dark:ring-brand-500/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-700 dark:text-brand-200">
            {t("dashboard.onboarding.title")}
          </p>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-100">
            {t("dashboard.onboarding.description")}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {steps.map((step) => (
              <li
                key={step.label}
                className={`inline-flex max-w-full min-w-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  step.done
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 break-words">{step.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2 sm:shrink-0 sm:justify-end">
          {!hasGroup && (
            <button type="button" className="btn-primary" onClick={onCreate}>
              <Plus className="h-4 w-4" />
              {t("dashboard.newGroup")}
            </button>
          )}
          <button type="button" className="btn-ghost" onClick={onDismiss}>
            <EyeOff className="h-4 w-4" />
            {t("dashboard.onboarding.dismiss")}
          </button>
        </div>
      </div>
    </section>
  );
}

function PersonalToolCard({
  to,
  title,
  description,
  icon,
  iconBg,
  experimental = false,
}: {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  experimental?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <li>
      <Link
        to={to}
        className="card group flex h-full flex-col gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-white ${iconBg}`}
          >
            {icon}
          </span>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          {experimental && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              {t("group.experimental")}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {description}
        </p>
        <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition-all group-hover:gap-2 dark:text-brand-400">
          {t("dashboard.open")} <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </li>
  );
}

function GroupCard({ group }: { group: GroupSummary }) {
  const { t } = useTranslation();
  return (
    <Link
      to={`/groups/${group.id}`}
      className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{group.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Users className="h-3.5 w-3.5" />
            {t("dashboard.memberCount", { count: group.member_count })} - {group.currency}
          </p>
        </div>
        {group.my_role === "owner" && (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            {t("dashboard.roleOwner")}
          </span>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        {t("dashboard.inviteCode")}:{" "}
        {group.invite_code ? (
          <span className="font-mono tracking-wider text-slate-600 dark:text-slate-300">
            {group.invite_code}
          </span>
        ) : (
          <span className="italic text-slate-500 dark:text-slate-400">
            {t("dashboard.inviteClosed")}
          </span>
        )}
      </p>
    </Link>
  );
}

function EmptyState({
  onCreate,
  onJoin,
}: {
  onCreate: () => void;
  onJoin: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="card flex min-w-0 flex-col items-center gap-3 p-6 text-center sm:p-10">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
        <Users className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-semibold">{t("dashboard.empty.title")}</h2>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
        {t("dashboard.empty.description")}
      </p>
      <div className="mt-2 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
        <button type="button" className="btn-primary flex-1" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          {t("dashboard.newGroup")}
        </button>
        <button type="button" className="btn-secondary flex-1" onClick={onJoin}>
          <UserPlus className="h-4 w-4" />
          {t("dashboard.join")}
        </button>
      </div>
    </div>
  );
}

function CreateGroupForm({ onDone }: { onDone: (created: boolean) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const g = await groupsApi.create(name.trim(), currency.trim());
      onDone(true);
      toast.success(t("dashboard.create.created", { name: g.name }));
      navigate(`/groups/${g.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <h3 className="font-semibold">{t("dashboard.create.title")}</h3>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1">
          <label className="label" htmlFor="group_name">
            {t("dashboard.create.name")}
          </label>
          <input
            id="group_name"
            className="input"
            required
            minLength={1}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("dashboard.create.namePlaceholder")}
          />
        </div>
        <div className="space-y-1">
          <label className="label" htmlFor="currency">
            {t("dashboard.create.currency")}
          </label>
          <input
            id="currency"
            className="input w-24"
            required
            minLength={3}
            maxLength={3}
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          />
        </div>
      </div>
      {error && <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={() => onDone(false)}>
          {t("common.cancel")}
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "..." : t("dashboard.create.submit")}
        </button>
      </div>
    </form>
  );
}

function JoinGroupForm({ onDone }: { onDone: (joined: boolean) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const g = await groupsApi.join(code.trim());
      onDone(true);
      toast.success(t("dashboard.joinForm.joined", { name: g.name }));
      navigate(`/groups/${g.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <h3 className="font-semibold">{t("dashboard.joinForm.title")}</h3>
      <div className="space-y-1">
        <label className="label" htmlFor="invite_code">
          {t("dashboard.joinForm.code")}
        </label>
        <input
          id="invite_code"
          className="input font-mono uppercase tracking-widest"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={t("dashboard.joinForm.codePlaceholder")}
        />
      </div>
      {error && <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={() => onDone(false)}>
          {t("common.cancel")}
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "..." : t("dashboard.joinForm.submit")}
        </button>
      </div>
    </form>
  );
}

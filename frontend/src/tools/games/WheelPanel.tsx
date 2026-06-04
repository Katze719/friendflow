import { Sparkles, Trash2, UserMinus, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Member } from "../../api/types";
import ParticipantPicker from "./ParticipantPicker";

interface WheelEntry {
  /** Local id (member id for members, generated for guests). */
  id: string;
  name: string;
  isMember: boolean;
}

// Distinct, theme-agnostic segment colors cycled around the wheel.
const SEGMENT_COLORS = [
  "#6366f1",
  "#06b6d4",
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#3b82f6",
  "#84cc16",
  "#f97316",
];

const CX = 110;
const CY = 110;
const R = 104;

function polar(angleDeg: number, radius: number) {
  // 0deg at the top, increasing clockwise.
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function slicePath(startDeg: number, endDeg: number) {
  const start = polar(startDeg, R);
  const end = polar(endDeg, R);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

export default function WheelPanel({ members }: { members: Member[] }) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<WheelEntry[]>([]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<WheelEntry | null>(null);
  const [removeWinnerNext, setRemoveWinnerNext] = useState(false);
  const guestSeq = useRef(0);

  const seg = entries.length > 0 ? 360 / entries.length : 360;

  const slices = useMemo(
    () =>
      entries.map((entry, i) => ({
        entry,
        path: slicePath(i * seg, (i + 1) * seg),
        color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
        labelPos: polar(i * seg + seg / 2, R * 0.62),
      })),
    [entries, seg],
  );

  function addGuest(name: string) {
    setWinner(null);
    setEntries((prev) => [
      ...prev,
      { id: `guest-${guestSeq.current++}`, name, isMember: false },
    ]);
  }

  function addMember(member: Member) {
    setWinner(null);
    setEntries((prev) =>
      prev.some((e) => e.id === member.id)
        ? prev
        : [...prev, { id: member.id, name: member.display_name, isMember: true }],
    );
  }

  function addAllMembers() {
    setWinner(null);
    setEntries((prev) => {
      const have = new Set(prev.map((e) => e.id));
      const additions = members
        .filter((m) => !have.has(m.id))
        .map<WheelEntry>((m) => ({
          id: m.id,
          name: m.display_name,
          isMember: true,
        }));
      return [...prev, ...additions];
    });
  }

  function removeEntry(id: string) {
    setWinner(null);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function removeWinner() {
    if (!winner) return;
    removeEntry(winner.id);
  }

  function spin() {
    if (spinning) return;
    // When the "eliminate winner" option is on, drop the last winner from the
    // wheel before this spin.
    let pool = entries;
    if (removeWinnerNext && winner) {
      pool = entries.filter((e) => e.id !== winner.id);
      setEntries(pool);
    }
    if (pool.length < 2) {
      setWinner(null);
      return;
    }
    setWinner(null);
    const winnerIndex = Math.floor(Math.random() * pool.length);
    const segSize = 360 / pool.length;
    // Rotation that lands the winning segment's center under the top pointer.
    const align = (360 - ((winnerIndex + 0.5) * segSize) % 360) % 360;
    const fullTurns = 5;
    const next =
      rotation - (rotation % 360) + 360 * fullTurns + align;
    setSpinning(true);
    setRotation(next);
    window.setTimeout(() => {
      setSpinning(false);
      setWinner(pool[winnerIndex]);
    }, 4200);
  }

  // Account for the winner that will be dropped just before the next spin.
  const effectiveCount =
    entries.length - (removeWinnerNext && winner ? 1 : 0);
  const canSpin = effectiveCount >= 2 && !spinning;

  return (
    <div className="space-y-6">
      <div className="card p-4 sm:p-6">
        <div className="relative mx-auto aspect-square w-full max-w-sm">
          {/* Pointer */}
          <div
            className="absolute left-1/2 top-0 z-10 -translate-x-1/2"
            aria-hidden
          >
            <div className="h-0 w-0 border-x-[12px] border-t-[20px] border-x-transparent border-t-rose-500 drop-shadow" />
          </div>
          <svg
            viewBox="0 0 220 220"
            className="h-full w-full"
            role="img"
            aria-label={t("games.wheel.title")}
          >
            <g
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: "110px 110px",
                transition: spinning
                  ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
                  : "none",
              }}
            >
              {entries.length === 0 ? (
                <circle
                  cx={CX}
                  cy={CY}
                  r={R}
                  className="fill-slate-100 stroke-slate-200 dark:fill-slate-800 dark:stroke-slate-700"
                />
              ) : (
                slices.map(({ entry, path, color, labelPos }) => (
                  <g key={entry.id}>
                    <path d={path} fill={color} stroke="#ffffff" strokeWidth={1} />
                    {entries.length <= 16 && (
                      <text
                        x={labelPos.x}
                        y={labelPos.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={entries.length > 9 ? 7 : 9}
                        fill="#ffffff"
                        fontWeight={600}
                      >
                        {entry.name.length > 12
                          ? `${entry.name.slice(0, 11)}…`
                          : entry.name}
                      </text>
                    )}
                  </g>
                ))
              )}
            </g>
            <circle
              cx={CX}
              cy={CY}
              r={14}
              className="fill-white stroke-slate-300 dark:fill-slate-900 dark:stroke-slate-600"
            />
          </svg>
        </div>

        <div className="mt-5 space-y-3">
          {winner && (
            <div className="space-y-2 rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-900/30">
              <p className="text-center text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                {t("games.wheel.winner", { name: winner.name })}
              </p>
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={removeWinner}
                disabled={spinning}
              >
                <UserMinus className="h-4 w-4" />
                {t("games.wheel.removeWinner")}
              </button>
            </div>
          )}
          <button
            type="button"
            className="btn-primary w-full py-3 text-base"
            onClick={spin}
            disabled={!canSpin}
          >
            <Sparkles className="h-5 w-5" />
            {spinning
              ? t("games.wheel.spinning")
              : winner
                ? t("games.wheel.spinAgain")
                : t("games.wheel.spin")}
          </button>

          <label className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={removeWinnerNext}
              onChange={(e) => setRemoveWinnerNext(e.target.checked)}
            />
            {t("games.wheel.autoRemove")}
          </label>

          {effectiveCount < 2 && (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              {t("games.wheel.empty")}
            </p>
          )}
        </div>
      </div>

      <div className="card space-y-4 p-4 sm:p-6">
        <h3 className="font-semibold">{t("games.participants.title")}</h3>
        <ParticipantPicker
          members={members}
          isMemberAdded={(id) => entries.some((e) => e.id === id)}
          onAddMember={addMember}
          onAddAllMembers={addAllMembers}
          onAddGuest={addGuest}
          disabled={spinning}
        />

        {entries.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-sm dark:bg-slate-800"
              >
                {entry.name}
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  disabled={spinning}
                  className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-slate-700"
                  aria-label={t("games.participants.remove")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("games.participants.empty")}
          </p>
        )}

        {entries.length > 0 && (
          <button
            type="button"
            className="btn-ghost text-rose-600 dark:text-rose-400"
            onClick={() => {
              setEntries([]);
              setWinner(null);
            }}
            disabled={spinning}
          >
            <Trash2 className="h-4 w-4" />
            {t("games.wheel.reset")}
          </button>
        )}
      </div>
    </div>
  );
}

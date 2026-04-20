import { useEffect, useRef, useState } from "react";

type TypewriterProps = {
  /** Phrases to cycle through in order. */
  phrases: string[];
  /** Time (ms) between typed characters. */
  typeSpeedMs?: number;
  /** Time (ms) between deleted characters. */
  deleteSpeedMs?: number;
  /** How long (ms) to hold a fully-typed phrase before deleting. */
  holdMs?: number;
  /** How long (ms) to pause after a phrase has been fully deleted. */
  gapMs?: number;
  /** Optional className applied to the outer span. */
  className?: string;
  /**
   * Screen-reader label for the whole animation. If omitted, the full list of
   * phrases is read out so assistive tech still gets a complete summary.
   */
  ariaLabel?: string;
};

type Phase = "typing" | "holding" | "deleting" | "gapping";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Cycling "typewriter" effect: types a phrase character-by-character, holds,
 * deletes it again, then moves on to the next one. Resets cleanly when the
 * list of phrases changes (e.g. on language switch).
 */
export default function Typewriter({
  phrases,
  typeSpeedMs = 65,
  deleteSpeedMs = 35,
  holdMs = 1600,
  gapMs = 350,
  className,
  ariaLabel,
}: TypewriterProps) {
  const [reducedMotion, setReducedMotion] = useState(() => prefersReducedMotion());
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    setText("");
    setPhase("typing");
    setIndex(0);
  }, [phrases]);

  useEffect(() => {
    if (reducedMotion) return;
    if (!phrases.length) return;

    const current = phrases[index % phrases.length] ?? "";
    let delay = typeSpeedMs;
    let action: () => void;

    if (phase === "typing") {
      if (text.length < current.length) {
        action = () => setText(current.slice(0, text.length + 1));
      } else {
        delay = holdMs;
        action = () => setPhase("holding");
      }
    } else if (phase === "holding") {
      delay = 0;
      action = () => setPhase("deleting");
    } else if (phase === "deleting") {
      if (text.length > 0) {
        delay = deleteSpeedMs;
        action = () => setText(current.slice(0, text.length - 1));
      } else {
        delay = gapMs;
        action = () => setPhase("gapping");
      }
    } else {
      action = () => {
        setIndex((i) => (i + 1) % phrases.length);
        setPhase("typing");
      };
    }

    timeoutRef.current = window.setTimeout(action, delay);
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [text, phase, index, phrases, reducedMotion, typeSpeedMs, deleteSpeedMs, holdMs, gapMs]);

  const srLabel = ariaLabel ?? phrases.join(" · ");

  if (reducedMotion) {
    const first = phrases[0] ?? "";
    return (
      <span aria-label={srLabel}>
        <span aria-hidden="true" className={className}>
          {first}
        </span>
      </span>
    );
  }

  return (
    <span aria-label={srLabel} className="inline-block align-baseline">
      <span aria-hidden="true" className={className}>
        {text}
      </span>
      <span
        aria-hidden="true"
        className="ml-1 inline-block w-[0.08em] -translate-y-[0.06em] animate-typewriter-caret bg-current align-middle"
        style={{ height: "0.9em" }}
      />
    </span>
  );
}

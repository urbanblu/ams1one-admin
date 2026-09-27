"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { IAutoDrawResult } from "@/interfaces/games.interface";
import { LuTrophy } from "react-icons/lu";

// ─── Ball color palette ────────────────────────────────────────────────────────
function getBallColor(n: number): string {
  if (n <= 14) return "#DC2626"; // red
  if (n <= 28) return "#2563EB"; // blue
  if (n <= 42) return "#16A34A"; // green
  if (n <= 56) return "#B45309"; // amber
  if (n <= 70) return "#7C3AED"; // purple
  if (n <= 84) return "#0891B2"; // cyan
  return "#DB2777"; // pink
}

// ─── Web Audio sound engine ───────────────────────────────────────────────────
function useSoundEngine() {
  const ctxRef = useRef<AudioContext | null>(null);
  const lastTickAt = useRef(0);

  function ctx(): AudioContext {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }

  // Call during a user-gesture so Chrome allows audio playback in later callbacks
  const resumeCtx = useCallback(() => {
    try {
      const c = ctx();
      if (c.state === "suspended") c.resume();
    } catch {}
  }, []);

  // Short tick: plays during the randomization sweep
  const tick = useCallback(() => {
    const now = Date.now();
    if (now - lastTickAt.current < 75) return; // cap ~13 ticks/sec
    lastTickAt.current = now;
    try {
      const c = ctx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);
      osc.frequency.value = 750 + Math.random() * 450;
      osc.type = "triangle";
      gain.gain.setValueAtTime(0.85, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.042);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.048);
    } catch {}
  }, []);

  // Two-tone chime: plays when a number is locked in
  const ding = useCallback(() => {
    try {
      const c = ctx();
      [880, 1320].forEach((freq, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(c.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        const t = c.currentTime + i * 0.09;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.9, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
        osc.start(t);
        osc.stop(t + 0.8);
      });
    } catch {}
  }, []);

  // C-major arpeggio fanfare: plays when all numbers are revealed
  const fanfare = useCallback(() => {
    try {
      const c = ctx();
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(c.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        const t = c.currentTime + i * 0.13;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.9, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
        osc.start(t);
        osc.stop(t + 0.95);
      });
    } catch {}
  }, []);

  useEffect(
    () => () => {
      ctxRef.current?.close().catch(() => {});
    },
    [],
  );

  return { resumeCtx, tick, ding, fanfare };
}

// ─── Confetti shower ──────────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  "#FF6B6B",
  "#FFE66D",
  "#A8E6CF",
  "#FFD93D",
  "#6C63FF",
  "#FF8C94",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#F1948A",
  "#FFFFFF",
  "#FFD700",
];

interface ConfettiPieceData {
  id: number;
  startX: number;
  delay: number;
  duration: number;
  color: string;
  w: number;
  h: number;
  drift: number;
  spins: number;
}

// Generated once at module load — never changes, no Math.random inside render
const CONFETTI_PIECES: ConfettiPieceData[] = Array.from(
  { length: 100 },
  (_, i) => {
    const size = 7 + Math.floor(Math.random() * 10);
    const isRect = Math.random() > 0.35;
    return {
      id: i,
      startX: Math.random() * 100,
      delay: Math.random() * 2.2,
      duration: 3.2 + Math.random() * 2.8,
      color:
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      w: isRect ? Math.round(size * 0.42) : size,
      h: size,
      drift: (Math.random() - 0.5) * 14,
      spins:
        (Math.random() > 0.5 ? 1 : -1) * (2 + Math.floor(Math.random() * 5)),
    };
  },
);

function ConfettiShower() {
  const pieces = CONFETTI_PIECES;

  return (
    <div className="fixed inset-0 pointer-events-none z-[10001] overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: "-4vh", x: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: "108vh",
            x: `${p.drift}vw`,
            opacity: [1, 1, 1, 0.7, 0],
            rotate: p.spins * 360,
          }}
          transition={{
            y: {
              duration: p.duration,
              delay: p.delay,
              ease: [0.2, 0.05, 0.6, 1],
            },
            x: { duration: p.duration, delay: p.delay, ease: "easeInOut" },
            opacity: { duration: p.duration, delay: p.delay },
            rotate: { duration: p.duration, delay: p.delay, ease: "linear" },
          }}
          style={{
            position: "fixed",
            left: `${p.startX}%`,
            top: 0,
            width: p.w,
            height: p.h,
            borderRadius: p.w === p.h ? "50%" : "2px",
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

// ─── Ball in the grid ─────────────────────────────────────────────────────────
const LotteryBall = React.memo(function LotteryBall({
  number,
  isHighlighted,
  isRevealed,
  size,
}: {
  number: number;
  isHighlighted: boolean;
  isRevealed: boolean;
  size: number;
}) {
  const color = getBallColor(number);
  const fontSize = Math.max(8, Math.round(size * 0.27));
  return (
    <motion.div
      animate={{
        scale: isHighlighted ? 1.18 : 1,
        opacity: isRevealed ? 0.2 : 1,
      }}
      transition={{
        scale: { type: "spring", stiffness: 500, damping: 18 },
        opacity: { duration: 0.4 },
      }}
      className="relative flex items-center justify-center rounded-full select-none shrink-0"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 38% 33%, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.22) 20%, ${color} 54%, rgba(0,0,0,0.38) 100%)`,
        boxShadow: isHighlighted
          ? `0 0 ${size * 0.22}px ${color}, 0 0 ${size * 0.44}px ${color}55, inset 0 2px 6px rgba(255,255,255,0.5)`
          : `0 ${size * 0.04}px ${size * 0.12}px rgba(0,0,0,0.65), inset 0 1px 3px rgba(255,255,255,0.3)`,
      }}
    >
      <div
        className="rounded-full bg-white flex items-center justify-center"
        style={{ width: "50%", height: "50%" }}
      >
        <span
          className="font-black text-black leading-none select-none"
          style={{ fontSize }}
        >
          {number}
        </span>
      </div>
    </motion.div>
  );
});

// ─── Revealed ball in the top strip ──────────────────────────────────────────
function RevealedBall({ number }: { number: number }) {
  const color = getBallColor(number);
  return (
    <motion.div
      initial={{ scale: 0, y: 20, opacity: 0, rotate: -18 }}
      animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 18 }}
      className="relative flex items-center justify-center rounded-full select-none shrink-0"
      style={{
        width: 68,
        height: 68,
        background: `radial-gradient(circle at 38% 33%, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.22) 20%, ${color} 54%, rgba(0,0,0,0.38) 100%)`,
        boxShadow: `0 0 22px ${color}80, 0 8px 24px rgba(0,0,0,0.7), inset 0 1px 3px rgba(255,255,255,0.4)`,
      }}
    >
      <div
        className="rounded-full bg-white flex items-center justify-center"
        style={{ width: "50%", height: "50%" }}
      >
        <span className="font-black text-black text-xs leading-none select-none">
          {number}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
interface DrawRevealScreenProps {
  result: IAutoDrawResult;
  onComplete: () => void;
}

type Phase = "intro" | "waiting" | "animating" | "complete";

export default function DrawRevealScreen({
  result,
  onComplete,
}: DrawRevealScreenProps) {
  const numbers = result.draw_result.numbers;
  const [revealedNumbers, setRevealedNumbers] = useState<number[]>([]);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [showConfetti, setShowConfetti] = useState(false);
  const [ballSize, setBallSize] = useState(60);
  const animatingRef = useRef(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { resumeCtx, tick, ding, fanfare } = useSoundEngine();

  const numberPool = result.draw_result.game_type.number_pool || 99;
  const COLS = 9;
  const ROWS = Math.ceil(numberPool / COLS);
  const GAP = 4;

  // Left panel = 4/6 of viewport width, full viewport height. Compute directly
  // from window dimensions so there's no timing issue with DOM measurement.
  useEffect(() => {
    const compute = () => {
      const panelW = (window.innerWidth * 4) / 6;
      const panelH = window.innerHeight;
      const fromW = (panelW - GAP * (COLS - 1)) / COLS;
      const fromH = (panelH - GAP * (ROWS - 1)) / ROWS;
      setBallSize(Math.max(20, Math.floor(Math.min(fromW, fromH))));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [ROWS]);

  // Request fullscreen on mount, exit on unmount
  useEffect(() => {
    document.documentElement
      .requestFullscreen({ navigationUI: "hide" } as FullscreenOptions)
      .catch(() => {});
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Brief intro pause before accepting input
  useEffect(() => {
    const t = setTimeout(() => setPhase("waiting"), 1000);
    return () => clearTimeout(t);
  }, []);

  function clearAllTimeouts() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }

  const revealNext = useCallback(() => {
    if (animatingRef.current) return;
    const nextIndex = revealedNumbers.length;
    if (nextIndex >= numbers.length) return;

    // Resume AudioContext during the user gesture (spacebar press)
    resumeCtx();

    const target = numbers[nextIndex];
    animatingRef.current = true;
    setPhase("animating");

    // Cubic ease-out schedule: fast start → dramatic slowdown → crawl
    const HOPS = 40;
    const MIN_DELAY = 28; // ms — initial flicker speed
    const MAX_DELAY = 470; // ms — final crawl before landing
    let cumulativeDelay = 0;

    for (let i = 0; i < HOPS; i++) {
      const tNorm = i / HOPS;
      const eased = tNorm * tNorm * tNorm;
      const delay = MIN_DELAY + eased * (MAX_DELAY - MIN_DELAY);
      cumulativeDelay += delay;

      const isLast = i === HOPS - 1;
      const capturedDelay = cumulativeDelay;

      timeoutsRef.current.push(
        setTimeout(() => {
          if (isLast) {
            setHighlighted(target);
          } else {
            let rand: number;
            // In the slow phase (last 25%) avoid landing on target prematurely
            const avoidTarget = tNorm > 0.75;
            do {
              rand = Math.floor(Math.random() * numberPool) + 1;
            } while (avoidTarget && rand === target);
            setHighlighted(rand);
            tick();
          }
        }, capturedDelay),
      );
    }

    // Pause on target → lock it in
    timeoutsRef.current.push(
      setTimeout(() => {
        ding();
        setRevealedNumbers((prev) => [...prev, target]);
        setHighlighted(null);
        animatingRef.current = false;

        const allDone = nextIndex + 1 >= numbers.length;
        if (allDone) {
          setPhase("complete");
          setShowConfetti(true);
          setTimeout(() => fanfare(), 120);
        } else {
          setPhase("waiting");
        }
      }, cumulativeDelay + 900),
    );
  }, [revealedNumbers, numbers, numberPool, resumeCtx, tick, ding, fanfare]);

  // Spacebar driver
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      if (phase === "waiting") revealNext();
      else if (phase === "complete") onComplete();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, revealNext, onComplete]);

  // Cleanup timeouts on unmount
  useEffect(() => () => clearAllTimeouts(), []);

  const revealedSet = new Set(revealedNumbers);

  return (
    <>
      {showConfetti && <ConfettiShower />}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-9999 overflow-hidden grid grid-cols-6"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, #1e0845 0%, #0c0820 45%, #050510 100%)",
        }}
      >
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        {/* ── Left: ball grid (4 of 6 cols, full height) ── */}
        <div className="relative z-10 col-span-4 flex items-center justify-center p-2">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${COLS}, ${ballSize}px)`,
              gap: GAP,
            }}
          >
            {Array.from({ length: numberPool }, (_, i) => i + 1).map((n) => (
              <LotteryBall
                key={n}
                number={n}
                isHighlighted={highlighted === n}
                isRevealed={revealedSet.has(n)}
                size={ballSize}
              />
            ))}
          </div>
        </div>

        {/* ── Right: info panel (2 of 6 cols) ── */}
        <div className="relative z-10 col-span-2 flex flex-col items-center justify-center gap-6 px-4 py-6">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col items-center gap-1 text-center"
          >
            <div className="flex items-center gap-2 mb-1">
              <LuTrophy className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-medium text-xs uppercase tracking-[0.2em]">
                {result.draw_result.game_type.name}
              </span>
              <LuTrophy className="w-5 h-5 text-yellow-400" />
            </div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white font-medium text-2xl tracking-widest uppercase"
            >
              Draw Results
            </motion.h1>
          </motion.div>

          {/* Revealed numbers */}
          <div className="w-full flex flex-col items-center gap-3">
            <span className="text-white/30 text-xs font-medium uppercase tracking-widest">
              Winning Numbers
            </span>
            <div className="flex flex-wrap gap-3 justify-center min-h-[72px] items-center">
              <AnimatePresence>
                {revealedNumbers.map((n) => (
                  <RevealedBall key={n} number={n} />
                ))}
              </AnimatePresence>
              {revealedNumbers.length === 0 && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-white/20 text-xs font-medium tracking-wider uppercase text-center"
                >
                  Numbers will appear here
                </motion.span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="w-4/5 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />

          {/* Phase instructions */}
          <div className="flex flex-col items-center min-h-[80px] justify-center">
            <AnimatePresence mode="wait">
              {phase === "intro" && (
                <motion.p
                  key="intro"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-white/30 text-xs font-medium tracking-widest uppercase text-center"
                >
                  Preparing draw…
                </motion.p>
              )}

              {phase === "waiting" && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <motion.p
                    animate={{ opacity: [0.55, 1, 0.55] }}
                    transition={{ repeat: Infinity, duration: 1.6 }}
                    className="text-white font-medium text-sm tracking-[0.12em] uppercase leading-snug"
                  >
                    Press SPACE to reveal{"\n"}number{" "}
                    {revealedNumbers.length + 1} of {numbers.length}
                  </motion.p>
                  <kbd className="bg-white/8 text-white/50 px-5 py-2 rounded-md text-sm font-mono border border-white/15 tracking-widest">
                    SPACE
                  </kbd>
                </motion.div>
              )}

              {phase === "animating" && (
                <motion.div
                  key="animating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  <motion.p
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 0.45 }}
                    className="text-yellow-400 font-medium text-lg tracking-[0.2em] uppercase"
                  >
                    Drawing…
                  </motion.p>
                  <motion.div
                    className="flex gap-1"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-yellow-400"
                      />
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {phase === "complete" && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <motion.p
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-yellow-400 font-medium text-2xl tracking-[0.15em] uppercase"
                  >
                    Draw Complete!
                  </motion.p>
                  <motion.p
                    animate={{ opacity: [0.4, 0.9, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.6 }}
                    className="text-white/50 text-xs font-medium tracking-widest uppercase"
                  >
                    Press SPACE to continue
                  </motion.p>
                  <kbd className="bg-white/8 text-white/50 px-5 py-2 rounded-md text-sm font-mono border border-white/15 tracking-widest">
                    SPACE
                  </kbd>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}

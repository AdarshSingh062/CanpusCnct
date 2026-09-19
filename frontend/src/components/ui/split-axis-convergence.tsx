"use client";

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ShaderBackground } from "./plasma-shader";

const IMG = {
  angle1: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80",
  angle2: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80",
  angle3: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80",
  angle4: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80",
  angle5: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80",
  angle6: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=80",
  angle7: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1000&q=80",
  angle8: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80",
} as const;

const SCALE: Partial<Record<number, number>> = {
  1: 0.85,
  2: 0.75,
  3: 0.85,
  4: 0.75,
  5: 0.75,
  6: 0.85,
  7: 0.85,
  8: 0.65,
};
const s = (i: number) => SCALE[i] ?? 1;

const CARDS: StackSpreadCard[] = [
  {
    item: { src: IMG.angle1, alt: "Track angle 1" },
    portalOffset: { x: -48, y: -30 },
    portalRotate: -15,
    target: { x: -22, y: -36, rotate: -4, scale: s(8), w: 16, h: 21 },
    targetSm: { x: -22, y: -40 },
    z: 2,
  },
  {
    item: { src: IMG.angle2, alt: "Track angle 2" },
    portalOffset: { x: 48, y: -20 },
    portalRotate: 15,
    target: { x: 34, y: -32, rotate: 6, scale: s(7), w: 17, h: 30 },
    targetSm: { x: 22, y: -40 },
    z: 3,
  },
  {
    item: { src: IMG.angle3, alt: "Track angle 3" },
    portalOffset: { x: -45, y: -10 },
    portalRotate: -10,
    target: { x: -38, y: -4, rotate: -2, scale: s(6), w: 14, h: 30 },
    targetSm: { x: -22, y: -19 },
    z: 4,
  },
  {
    item: { src: IMG.angle4, alt: "Track angle 4" },
    portalOffset: { x: 45, y: 0 },
    portalRotate: 10,
    target: { x: 4, y: -34, rotate: 3, scale: s(5), w: 24, h: 28 },
    targetSm: { x: 22, y: -19 },
    z: 5,
  },
  {
    item: { src: IMG.angle5, alt: "Track angle 5" },
    portalOffset: { x: -42, y: 10 },
    portalRotate: -5,
    target: { x: 38, y: 8, rotate: -3, scale: s(4), w: 17, h: 30 },
    targetSm: { x: -22, y: 20 },
    z: 6,
  },
  {
    item: { src: IMG.angle6, alt: "Track angle 6" },
    portalOffset: { x: 42, y: 20 },
    portalRotate: 5,
    target: { x: -26, y: 36, rotate: 5, scale: s(3), w: 21, h: 24 },
    targetSm: { x: 22, y: 20 },
    z: 7,
  },
  {
    item: { src: IMG.angle7, alt: "Track angle 7" },
    portalOffset: { x: -40, y: 30 },
    portalRotate: -8,
    target: { x: 2, y: 38, rotate: -2, scale: s(2), w: 19, h: 25 },
    targetSm: { x: -22, y: 40 },
    z: 8,
  },
  {
    item: { src: IMG.angle8, alt: "Track angle 8" },
    portalOffset: { x: 40, y: 35 },
    portalRotate: 8,
    target: { x: 32, y: 36, rotate: 4, scale: s(1), w: 15, h: 19 },
    targetSm: { x: 22, y: 40 },
    z: 9,
  },
];

const SCATTER_START = 0.12;
const SCATTER_END = 0.85;
const PARALLAX_INTENSITY = 2.5;
const SPRING_CONFIG = { stiffness: 85, damping: 25, mass: 0.6 };
const PROGRESS_SPRING = { stiffness: 95, damping: 28, restDelta: 0.0001 };

const SUB_BEFORE = "Build friendships, discover events, and stay on top of campus life.";
const SUB_AFTER = "One connected campus experience for students, clubs, and opportunities.";

function useResponsive() {
  const [r, setR] = useState(RESPONSIVE_DESKTOP);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const read = () => setR(mq.matches ? RESPONSIVE_SMALL : RESPONSIVE_DESKTOP);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);
  return r;
}

const RESPONSIVE_DESKTOP = {
  scale: null as number | null,
  small: false,
  colX: null as number | null,
  card: null as { w: number; h: number } | null,
};

const RESPONSIVE_SMALL = {
  scale: 0.72,
  small: true,
  colX: 22,
  card: { w: 40, h: 20 },
};

function usePointerParallax(active: boolean, enabled: boolean) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING_CONFIG);
  const y = useSpring(rawY, SPRING_CONFIG);

  useEffect(() => {
    if (!enabled) return;
    if (!active) {
      rawX.set(0);
      rawY.set(0);
      return;
    }

    const onMove = (event: PointerEvent) => {
      rawX.set((event.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((event.clientY / window.innerHeight - 0.5) * 2);
    };
    const onLeave = () => {
      rawX.set(0);
      rawY.set(0);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [active, enabled, rawX, rawY]);

  return { x, y };
}

export interface StackSpreadItem {
  src: string;
  alt?: string;
}

export interface StackSpreadTarget {
  x: number;
  y: number;
  rotate: number;
  scale?: number;
  w: number;
  h: number;
}

export interface StackSpreadCard {
  item: StackSpreadItem;
  target: StackSpreadTarget;
  targetSm?: { x: number; y: number };
  portalRotate?: number;
  portalOffset?: { x: number; y: number };
  z?: number;
}

function Card({
  card,
  progress,
  reduce,
  scaleMul,
  isSmall,
  colX,
  fixedCard,
  stackScale,
  cardRadius,
  pointer,
  index,
  total,
  isSpreadActive,
}: {
  card: StackSpreadCard;
  progress: MotionValue<number>;
  reduce: boolean | null;
  scaleMul: number | null;
  isSmall: boolean;
  colX: number | null;
  fixedCard: { w: number; h: number } | null;
  stackScale: number;
  cardRadius: number;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  index: number;
  total: number;
  isSpreadActive: boolean;
}) {
  const { item, target } = card;

  const flat = reduce === true;
  const portalRotate = flat ? 0 : card.portalRotate ?? 0;
  const portalOffset = card.portalOffset ?? { x: 0, y: 0 };
  const restScale = scaleMul ?? target.scale ?? 1;

  const sm = isSmall && card.targetSm ? card.targetSm : null;
  const endX = sm ? (colX != null ? Math.sign(sm.x) * colX : sm.x) : target.x;
  const endY = sm ? sm.y : target.y;
  const endRotate = flat || isSmall ? 0 : target.rotate;

  const depthFactor = 0.5 + (index / (total - 1 || 1)) * 0.7;

  const translate = useTransform(
    [progress, pointer.x, pointer.y],
    ([p, px, py]: number[]) => {
      const easeP = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      const tx = portalOffset.x + (endX - portalOffset.x) * easeP;
      const ty = portalOffset.y + (endY - portalOffset.y) * easeP;

      const dx = tx - px * PARALLAX_INTENSITY * depthFactor * p;
      const dy = ty - py * PARALLAX_INTENSITY * depthFactor * p;
      return `calc(-50% + ${dx}vw) calc(-50% + ${dy}vh)`;
    }
  );

  const rotate = useTransform(progress, [0, 1], [portalRotate, endRotate]);
  const scale = useTransform(progress, [0, 1], [stackScale, restScale]);

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 will-change-transform cursor-pointer"
      style={{
        width: `${fixedCard ? fixedCard.w : target.w}vw`,
        height: `${fixedCard ? fixedCard.h : target.h}vh`,
        zIndex: card.z ?? 1,
        translate,
        rotate,
        scale,
      }}
      whileHover={
        isSpreadActive && !isSmall
          ? { scale: restScale * 1.05, y: -10, zIndex: 100, transition: { type: "spring", stiffness: 300, damping: 20 } }
          : undefined
      }
    >
      <div
        className="relative h-full w-full overflow-hidden shadow-xl shadow-black/10 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/10 transition-shadow duration-300 max-md:rounded-[4vw]"
        style={{ borderRadius: `${cardRadius}px` }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/20 opacity-60 pointer-events-none z-10" />
        <img
          src={item.src}
          alt={item.alt ?? ""}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
        />
      </div>
    </motion.div>
  );
}

interface StackSpreadStageProps {
  cards: StackSpreadCard[];
  scrollLength?: number;
  stackScale?: number;
  cardRadius?: number;
  textFadeStart?: number;
  showScrollHint?: boolean;
}

function StackSpreadStage({
  cards,
  scrollLength = 380,
  stackScale = 0.72,
  cardRadius = 12,
  textFadeStart = 0.28,
  showScrollHint = true,
}: StackSpreadStageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scale: scaleMul, small: isSmall, colX, card: fixedCard } = useResponsive();

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, PROGRESS_SPRING);

  const progress = useTransform(
    smoothProgress,
    [0, SCATTER_START, SCATTER_END, 1],
    [0, 0, 1, 1]
  );

  const [spread, setSpread] = useState(false);
  useMotionValueEvent(progress, "change", (p) => {
    setSpread((was) => (was ? p > 0.985 : p >= 0.999));
  });

  const parallaxEnabled = reduce !== true && !isSmall;
  const pointer = usePointerParallax(spread, parallaxEnabled);

  const noScale = reduce === true;

  const beforeOpacity = useTransform(progress, [textFadeStart, textFadeStart + 0.2, 0.65, 0.75], [0, 1, 1, 0]);
  const beforeY = useTransform(progress, [textFadeStart, textFadeStart + 0.2], [20, 0]);

  const afterOpacity = useTransform(progress, [0.68, 0.78], [0, 1]);
  const afterY = useTransform(progress, [0.68, 0.78], [20, 0]);

  const copyScale = useTransform(progress, [textFadeStart, 0.88], [0.9, 1]);
  const hintOpacity = useTransform(progress, [0, SCATTER_START], [1, 0]);

  return (
    <section
      ref={wrapRef}
      className="relative w-full select-none bg-[#faf9f6] dark:bg-[#0a0a0c] transition-colors duration-500"
      style={{ height: `${scrollLength}vh` }}
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,166,35,0.20),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(27,35,64,0.18),_transparent_30%)]" />
        <div className="h-full w-full opacity-90">
          <ShaderBackground className="h-full w-full" />
        </div>
      </div>
      <div className="sticky top-0 h-screen w-full overflow-hidden relative z-10">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25 dark:opacity-15 blur-[120px]">
          <div className="w-[50vw] h-[50vw] rounded-full bg-stone-300 dark:bg-indigo-900" />
        </div>

        <motion.div
          className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center px-6 text-center max-md:px-8"
          style={{
            scale: noScale ? 1 : copyScale,
          }}
        >
          <motion.div
            className="absolute flex flex-col items-center max-w-2xl px-4"
            style={{ opacity: beforeOpacity, y: beforeY }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1b2340]/15 bg-white/70 px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.25em] text-[#1b2340] shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-[#111827]/60 dark:text-zinc-100">
              <span className="h-2 w-2 rounded-full bg-[#f5a623]" />
              CampusConnect
            </div>
            <h2 className="w-full whitespace-pre-line text-[4.8vw] font-light tracking-tight text-zinc-900 dark:text-zinc-100 max-md:text-[10vw]">
              Campus life, <span className="font-normal text-[#1b2340] dark:text-[#f5a623]">connected.</span>
            </h2>
            <p className="mt-[1.4vw] w-full max-w-[40ch] text-[1.1vw] font-light leading-relaxed tracking-wide text-zinc-600 dark:text-zinc-400 max-md:mt-3 max-md:text-[3.6vw]">
              {SUB_BEFORE}
            </p>
          </motion.div>

          <motion.div
            className="absolute flex flex-col items-center max-w-2xl px-4"
            style={{ opacity: afterOpacity, y: afterY }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1b2340]/15 bg-[#f5a623]/10 px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.25em] text-[#1b2340] shadow-sm backdrop-blur-sm dark:border-[#f5a623]/30 dark:bg-[#f5a623]/10 dark:text-[#f5a623]">
              <span className="h-2 w-2 rounded-full bg-[#1b2340] dark:bg-[#f5a623]" />
              Student-first platform
            </div>
            <h2 className="w-full whitespace-pre-line text-[4.8vw] font-light tracking-tight text-zinc-900 dark:text-zinc-100 max-md:text-[10vw]">
              Your campus, <span className="font-normal text-[#f5a623] dark:text-[#f5a623]">in sync.</span>
            </h2>
            <p className="mt-[1.4vw] w-full max-w-[40ch] text-[1.1vw] font-light leading-relaxed tracking-wide text-zinc-600 dark:text-zinc-400 max-md:mt-3 max-md:text-[3.6vw]">
              {SUB_AFTER}
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          className="pointer-events-auto absolute inset-x-0 bottom-[11vh] z-20 flex justify-center px-5"
          style={{ opacity: hintOpacity }}
        >
          <div className="w-full max-w-3xl rounded-[28px] border border-[#1b2340]/10 bg-white/75 p-5 shadow-[0_24px_60px_rgba(17,24,39,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-[#111827]/70 max-md:max-w-[92vw] max-md:p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#1b2340]/70 dark:text-zinc-300">
                  Your campus ecosystem
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[#1b2340] dark:text-white md:text-2xl">
                  Connect. Discover. Belong.
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-full bg-[#1b2340] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#2a3459]"
                >
                  Explore dashboard
                </a>
                <a
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-[#1b2340]/10 bg-white px-5 py-2.5 text-sm font-medium text-[#1b2340] transition hover:border-[#1b2340]/30 hover:bg-[#f6f7fb] dark:border-white/15 dark:bg-[#0b1120] dark:text-zinc-100"
                >
                  Sign in
                </a>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { value: '150+', label: 'clubs & orgs' },
                { value: '24/7', label: 'student updates' },
                { value: '1 hub', label: 'for campus life' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[#1b2340]/8 bg-[#f6f7fb] p-3 text-left dark:border-white/10 dark:bg-[#0f172a]">
                  <div className="text-lg font-semibold text-[#1b2340] dark:text-white">{stat.value}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[#1b2340]/60 dark:text-zinc-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="absolute inset-0 z-10">
          {cards.map((card, i) => (
            <Card
              key={i}
              card={card}
              progress={progress}
              reduce={reduce}
              scaleMul={scaleMul}
              isSmall={isSmall}
              colX={colX}
              fixedCard={fixedCard}
              stackScale={stackScale}
              cardRadius={cardRadius}
              pointer={pointer}
              index={i}
              total={cards.length}
              isSpreadActive={spread}
            />
          ))}
        </div>

        {showScrollHint && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-[4vh] z-20 flex flex-col items-center gap-[0.8vh] text-[0.75vw] font-medium uppercase tracking-[0.25em] text-zinc-900 dark:text-zinc-100 max-md:bottom-6 max-md:gap-1 max-md:text-[2.6vw]"
            style={{ opacity: hintOpacity }}
          >
            <span className="opacity-60">Scroll to Converge</span>
            <div className="w-[1px] h-6 bg-current opacity-20 relative overflow-hidden">
              <motion.div
                className="absolute inset-x-0 top-0 bg-current h-full"
                animate={{ y: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export interface SplitAxisProps {
  scrollLength?: number;
  stackScale?: number;
  cardRadius?: number;
  textFadeStart?: number;
  showScrollHint?: boolean;
}

export default function SplitAxisConvergence({
  scrollLength = 380,
  stackScale = 0.72,
  cardRadius = 12,
  textFadeStart = 0.28,
  showScrollHint = true,
}: SplitAxisProps = {}) {
  return (
    <StackSpreadStage
      cards={CARDS}
      scrollLength={scrollLength}
      stackScale={stackScale}
      cardRadius={cardRadius}
      textFadeStart={textFadeStart}
      showScrollHint={showScrollHint}
    />
  );
}

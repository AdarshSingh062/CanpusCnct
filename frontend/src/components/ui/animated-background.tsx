import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, type Transition } from 'motion/react';

type AnimatedBackgroundProps = {
  children: ReactNode;
  defaultValue?: string;
  className?: string;
  transition?: Transition;
  enableHover?: boolean;
};

export function AnimatedBackground({
  children,
  defaultValue,
  className = '',
  transition,
  enableHover = false,
}: AnimatedBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeValue, setActiveValue] = useState(defaultValue);
  const [indicator, setIndicator] = useState({ top: 0, height: 42 });

  useEffect(() => {
    setActiveValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const activeElement = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>('[data-id]') ?? []
    ).find((element) => element.dataset.id === activeValue);

    if (!activeElement || !containerRef.current) return;

    setIndicator({
      top: activeElement.offsetTop,
      height: activeElement.offsetHeight,
    });
  }, [activeValue, children]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col"
      onMouseLeave={() => setActiveValue(defaultValue)}
      onMouseOver={(event) => {
        if (!enableHover) return;
        const target = (event.target as HTMLElement).closest<HTMLElement>('[data-id]');
        if (target?.dataset.id) setActiveValue(target.dataset.id);
      }}
    >
      {activeValue && (
        <motion.div
          layoutId="animated-background"
          className={`pointer-events-none absolute inset-x-0 z-0 ${className}`}
          style={{ top: indicator.top, height: indicator.height }}
          transition={transition}
        />
      )}
      {children}
    </div>
  );
}
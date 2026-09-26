import { useEffect, useRef, useState, ReactNode, CSSProperties } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  /** Direction the element travels in from. */
  from?: "up" | "down" | "left" | "right" | "fade" | "scale" | "subtle-up";
  /** Stagger delay in ms — useful for revealing a list of siblings in sequence. */
  delay?: number;
  /** Duration in ms */
  duration?: number;
  /** Only ever animate once (default) or re-trigger every time it re-enters view. */
  once?: boolean;
  className?: string;
  style?: CSSProperties;
  as?: keyof JSX.IntrinsicElements;
}

const OFFSETS: Record<NonNullable<ScrollRevealProps["from"]>, { transform: string; scale?: string }> = {
  up: { transform: "translateY(36px)" },
  "subtle-up": { transform: "translateY(16px)" },
  down: { transform: "translateY(-36px)" },
  left: { transform: "translateX(36px)" },
  right: { transform: "translateX(-36px)" },
  scale: { transform: "scale(0.96)" },
  fade: { transform: "none" },
};

/**
 * Fades + translates children into place as they cross into the viewport.
 * Pure CSS transition driven by an IntersectionObserver toggling state —
 * Zero external bundle overhead, 60fps GPU-accelerated, and respects prefers-reduced-motion.
 */
export default function ScrollReveal({
  children,
  from = "up",
  delay = 0,
  duration = 750,
  once = true,
  className = "",
  style,
  as = "div",
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(node);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  const Tag = as as any;
  const initialOffset = OFFSETS[from];

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0, 0) scale(1)" : initialOffset.transform,
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: "opacity, transform",
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

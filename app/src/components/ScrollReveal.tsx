import { useEffect, useRef, useState, ReactNode, CSSProperties } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  /** Direction the element travels in from. */
  from?: "up" | "down" | "left" | "right" | "fade";
  /** Stagger delay in ms — useful for revealing a list of siblings in sequence. */
  delay?: number;
  /** Only ever animate once (default) or re-trigger every time it re-enters view. */
  once?: boolean;
  className?: string;
  style?: CSSProperties;
  as?: keyof JSX.IntrinsicElements;
}

const OFFSETS: Record<NonNullable<ScrollRevealProps["from"]>, string> = {
  up: "translateY(28px)",
  down: "translateY(-28px)",
  left: "translateX(28px)",
  right: "translateX(-28px)",
  fade: "translateY(0)",
};

/**
 * Fades + translates children into place as they cross into the viewport.
 * Pure CSS transition driven by an IntersectionObserver toggling one class —
 * no animation library, so it stays cheap and respects reduced-motion.
 */
export default function ScrollReveal({
  children,
  from = "up",
  delay = 0,
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
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  const Tag = as as any;

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0, 0)" : OFFSETS[from],
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: "opacity, transform",
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

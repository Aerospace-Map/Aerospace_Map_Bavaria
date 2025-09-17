import { useEffect } from "react";

/**
 * Minimal parallax engine.
 * Usage: give an element data-speed (e.g., 0.15) and optional data-translate="y|x"
 * Example: <div data-parallax data-speed="0.12" />
 */
export default function useParallax() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-parallax]"));

    const read = (el, attr, fallback) => {
      const v = parseFloat(el.getAttribute(attr));
      return Number.isFinite(v) ? v : fallback;
    };

    const onScroll = () => {
      const y = window.scrollY;
      for (const el of els) {
        const speed = read(el, "data-speed", 0.15);
        const axis = el.getAttribute("data-translate") || "y";
        const move = -y * speed;
        if (axis === "x") el.style.transform = `translate3d(${move}px,0,0)`;
        else el.style.transform = `translate3d(0,${move}px,0)`;
      }
    };

    // smooth start + passives
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}

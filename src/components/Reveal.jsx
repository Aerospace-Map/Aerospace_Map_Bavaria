// src/components/Reveal.jsx
import { useEffect, useRef } from "react";

export function Reveal({ children, threshold = 0.15, once = true }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("reveal-in");
            if (once) io.unobserve(el);
          } else if (!once) {
            el.classList.remove("reveal-in");
          }
        });
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);

  return (
    <div ref={ref} className="reveal">
      {children}
    </div>
  );
}

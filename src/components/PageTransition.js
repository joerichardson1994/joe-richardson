"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const containerRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!containerRef.current) return;

    let hasHeroTransition = false;
    try {
      hasHeroTransition = !!sessionStorage.getItem("heroTransition");
    } catch {
      hasHeroTransition = false;
    }

    if (hasHeroTransition) {
      gsap.set(containerRef.current, { y: 0, autoAlpha: 1 });
      return;
    }

    gsap.fromTo(
      containerRef.current,
      { y: 40, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.7,
        ease: "back.out(1.4)",
      }
    );
  }, [pathname]);

  return (
    <div ref={containerRef} style={{ height: "100%", willChange: "transform, opacity" }}>
      {children}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

export default function SiteCursor() {
  const dotRef = useRef(null);
  const pos = useRef({ x: -100, y: -100 });
  const isTouch = useRef(true);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    isTouch.current = !mq.matches;
    const updateTouch = () => {
      isTouch.current = !mq.matches;
    };
    mq.addEventListener("change", updateTouch);

    function onMove(e) {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      const el = dotRef.current;
      if (!el) return;
      const overGallery = e.target.closest?.(".project_gallery:not(.no-gallery)");
      el.style.opacity = overGallery || isTouch.current ? "0" : "1";
    }

    function onLeave() {
      const el = dotRef.current;
      if (el) el.style.opacity = "0";
    }

    let raf;
    function loop() {
      const el = dotRef.current;
      if (el) {
        el.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      mq.removeEventListener("change", updateTouch);
    };
  }, []);

  return <div ref={dotRef} className="site_cursor" aria-hidden="true" />;
}

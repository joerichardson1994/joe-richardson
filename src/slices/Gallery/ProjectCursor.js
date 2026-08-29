"use client";

import { useEffect, useRef, useState } from "react";

export default function ProjectCursor({ containerRef, mode, hasNext, hasPrev }) {
  const [side, setSide] = useState(null);
  const [visible, setVisible] = useState(false);
  const dotRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const sideRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onMove(e) {
      const rect = el.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setVisible(true);
    }
    function onLeave() {
      setVisible(false);
      sideRef.current = null;
      setSide(null);
    }

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);

    let raf;
    function loop() {
      const el2 = containerRef.current;
      if (el2) {
        const rect = el2.getBoundingClientRect();
        const { x, y } = mouseRef.current;
        const newSide = x < rect.width / 2 ? "left" : "right";
        if (newSide !== sideRef.current) {
          sideRef.current = newSide;
          setSide(newSide);
        }
        if (dotRef.current) {
          dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [containerRef]);

  const showLeft = mode === "single" && side === "left" && hasPrev;
  const showRight = mode === "single" && side === "right" && hasNext;
  const showOpen = mode === "single" && side !== null && !showLeft && !showRight;
  const showClose = mode === "thumbs";

  return (
    <div ref={dotRef} className={`project_cursor${visible ? " visible" : ""}`}>
      <div className="cursor cursor--left" style={{ display: showLeft ? "flex" : "none" }}>
        <svg className="icon">
          <use xlinkHref="#chevron-left" />
        </svg>
        <span>previous</span>
      </div>
      <div className="cursor cursor--right" style={{ display: showRight ? "flex" : "none" }}>
        <span>next</span>
        <svg className="icon">
          <use xlinkHref="#chevron-right" />
        </svg>
      </div>
      <div className="cursor cursor--close" style={{ display: showClose ? "flex" : "none" }}>
        <span>close</span>
        <svg className="icon">
          <use xlinkHref="#close" />
        </svg>
      </div>
      <div className="cursor cursor--open" style={{ display: showOpen ? "flex" : "none" }}>
        <span>open</span>
        <svg className="icon">
          <use xlinkHref="#open" />
        </svg>
      </div>
    </div>
  );
}

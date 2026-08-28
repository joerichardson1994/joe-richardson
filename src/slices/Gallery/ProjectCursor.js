"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Custom cursor for the gallery, mirroring the reference theme: it
 * follows the pointer, and swaps its icon based on which side of the
 * frame the pointer is over (previous/next) or whether the gallery is
 * in thumbnail mode (open/close). Hidden entirely on touch devices,
 * since it relies on mouse hover.
 */
export default function ProjectCursor({ containerRef, mode, hasNext, hasPrev }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [side, setSide] = useState("right");
  const [visible, setVisible] = useState(false);
  const cursorRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onMove(e) {
      const rect = el.getBoundingClientRect();
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setSide(e.clientX - rect.left < rect.width / 2 ? "left" : "right");
      setVisible(true);
    }
    function onLeave() {
      setVisible(false);
    }

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [containerRef]);

  const showLeft = mode === "single" && side === "left" && hasPrev;
  const showRight = mode === "single" && side === "right" && hasNext;
  const showOpen = mode === "single" && !showLeft && !showRight;
  const showClose = mode === "thumbs";

  return (
    <div
      className={`project_cursor${visible ? " visible" : ""}`}
      style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
      ref={cursorRef}
    >
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

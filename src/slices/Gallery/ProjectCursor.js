"use client";

import { useEffect, useState } from "react";

export default function ProjectCursor({ containerRef, mode, hasNext, hasPrev }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [side, setSide] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      setPos({ x: relX, y: relY });
      setSide(relX < rect.width / 2 ? "left" : "right");
      setVisible(true);
    }

    function onLeave() {
      setVisible(false);
      setSide(null);
    }

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [containerRef, mode]);

  const showLeft = mode === "single" && side === "left" && hasPrev;
  const showRight = mode === "single" && side === "right" && hasNext;
  const showOpen = mode === "single" && side !== null && !showLeft && !showRight;
  const showClose = mode === "thumbs";

  return (
    <div
      className={`project_cursor${visible ? " visible" : ""}`}
      style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
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

"use client";

import { useEffect, useRef, useState } from "react";

export default function SiteCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsTouch(!mq.matches);
    const update = () => setIsTouch(!mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isTouch) return;

    function onMove(e) {
      const overGallery = e.target.closest?.(".project_gallery:not(.no-gallery)");
      setVisible(!overGallery);
      setPos({ x: e.clientX, y: e.clientY });
    }
    function onLeave() {
      setVisible(false);
    }

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [isTouch]);

  if (isTouch) return null;

  return (
    <div
      className={`site_cursor${visible ? " visible" : ""}`}
      style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
      aria-hidden="true"
    />
  );
}

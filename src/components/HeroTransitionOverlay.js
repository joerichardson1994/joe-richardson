"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function HeroTransitionOverlay({ projectUid, targetRef }) {
  const [transitionData, setTransitionData] = useState(null);
  const [ready, setReady] = useState(false);
  const cloneRef = useRef(null);

  useEffect(() => {
    let stored = null;
    try {
      const raw = sessionStorage.getItem("heroTransition");
      if (raw) stored = JSON.parse(raw);
    } catch {
      stored = null;
    }

    if (stored && stored.uid === projectUid) {
      setTransitionData(stored);
    }

    try {
      sessionStorage.removeItem("heroTransition");
    } catch {
      // ignore
    }
  }, [projectUid]);

  useEffect(() => {
    if (!transitionData || !cloneRef.current) return;

    const raf = requestAnimationFrame(() => {
      const targetEl = targetRef.current;
      if (!targetEl) {
        setReady(true);
        return;
      }
      const targetRect = targetEl.getBoundingClientRect();

      gsap.to(cloneRef.current, {
        top: targetRect.top,
        left: targetRect.left,
        width: targetRect.width,
        height: targetRect.height,
        duration: 1.6,
        ease: "cubic-bezier(0.34, 0, 0.2, 1.6)",
        onComplete: () => setReady(true),
      });
    });

    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitionData]);

  useEffect(() => {
    const targetEl = targetRef.current;
    if (!targetEl) return;
    if (transitionData && !ready) {
      targetEl.style.visibility = "hidden";
    } else {
      targetEl.style.visibility = "";
    }
  }, [transitionData, ready, targetRef]);

  if (!transitionData || ready) return null;

  const { rect, src } = transitionData;

  return (
    <div
      ref={cloneRef}
      style={{
        position: "fixed",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        zIndex: 50,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  );
}

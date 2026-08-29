"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PrismicImage } from "@prismicio/react";
import gsap from "gsap";
import ProjectCursor from "./ProjectCursor";
import HeroTransitionOverlay from "@/components/HeroTransitionOverlay";

export default function Gallery({ slice, context }) {
  const images = slice.items || [];
  const [mode, setMode] = useState("single");
  const [selected, setSelected] = useState(0);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [hasSwiped, setHasSwiped] = useState(false);
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const firstImageRef = useRef(null);

  const measure = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setFrameSize({ width: rect.width, height: rect.height });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "ArrowRight") goTo(selected + 1);
      if (e.key === "ArrowLeft") goTo(selected - 1);
      if (e.key === "Escape" && mode === "thumbs") setMode("single");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, mode]);

  const wheelLockRef = useRef(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || images.length < 2) return;

    function onWheel(e) {
      e.preventDefault();
      if (wheelLockRef.current) return;
      const delta =
        Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 8) return;
      wheelLockRef.current = true;
      delta > 0 ? goTo(selected + 1) : goTo(selected - 1);
      setTimeout(() => {
        wheelLockRef.current = false;
      }, 350);
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, images.length]);

  const touchRef = useRef({ startX: 0, startY: 0, startTime: 0, active: false, committed: false });
  const justSwipedRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || images.length < 2 || mode !== "single") return;

    function onTouchStart(e) {
      const t = e.touches[0];
      touchRef.current = {
        startX: t.clientX,
        startY: t.clientY,
        startTime: Date.now(),
        active: true,
        committed: false,
      };
      gsap.killTweensOf(trackRef.current);
    }

    function onTouchMove(e) {
      if (!touchRef.current.active) return;
      const t = e.touches[0];
      const dx = t.clientX - touchRef.current.startX;
      const dy = t.clientY - touchRef.current.startY;

      if (!touchRef.current.committed) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        touchRef.current.committed = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      }

      if (touchRef.current.committed === "horizontal") {
        e.preventDefault();
        setHasSwiped(true);
        if (trackRef.current) {
          gsap.set(trackRef.current, { x: dx });
        }
      }
    }

    function onTouchEnd(e) {
      if (!touchRef.current.active) return;
      touchRef.current.active = false;
      if (touchRef.current.committed !== "horizontal") return;

      const t = e.changedTouches[0];
      const dx = t.clientX - touchRef.current.startX;
      const elapsed = Date.now() - touchRef.current.startTime;
      const velocity = Math.abs(dx) / Math.max(elapsed, 1);
      const isSwipe = Math.abs(dx) > frameSize.width * 0.2 || velocity > 0.5;

      if (isSwipe && ((dx < 0 && selected < images.length - 1) || (dx > 0 && selected > 0))) {
        justSwipedRef.current = true;
        gsap.to(trackRef.current, {
          x: dx < 0 ? -frameSize.width : frameSize.width,
          duration: 0.25,
          ease: "power2.out",
          onComplete: () => {
            gsap.set(trackRef.current, { x: 0 });
            goTo(selected + (dx < 0 ? 1 : -1));
          },
        });
      } else {
        gsap.to(trackRef.current, {
          x: 0,
          duration: 0.5,
          ease: "elastic.out(1, 0.65)",
        });
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, images.length, mode, frameSize.width]);

  function goTo(index) {
    if (images.length === 0) return;
    setSelected((index + images.length) % images.length);
  }

  if (images.length === 0) return null;

  const padding = 20;
  const usableWidth = Math.max(frameSize.width - padding * 2, 0);
  const usableHeight = Math.max(frameSize.height - padding * 2, 0);

  function fittedSize(imgWidth, imgHeight) {
    if (!usableWidth || !usableHeight || !imgWidth || !imgHeight) {
      return { width: 0, height: 0 };
    }
    const scale = Math.min(usableWidth / imgWidth, usableHeight / imgHeight);
    return { width: Math.round(imgWidth * scale), height: Math.round(imgHeight * scale) };
  }

  const THUMB_HEIGHT_RATIO = 0.35;
  const THUMB_GAP = 20;
  const SELECTED_SCALE = 0.75;
  const OTHER_SCALE = 0.48;

  function getThumbLayout() {
    const thumbTargetHeight = frameSize.height * THUMB_HEIGHT_RATIO || 1;
    let cursor = 0;
    const layout = images.map((item, i) => {
      const dims = item.image?.dimensions || { width: 1, height: 1 };
      const aspect = dims.width / dims.height;
      const boxWidth = dims.width;
      const boxHeight = dims.height;
      const scale = i === selected ? SELECTED_SCALE : OTHER_SCALE;
      const displayHeight = thumbTargetHeight * scale;
      const displayWidth = displayHeight * aspect;
      const centerX = cursor + displayWidth / 2;
      cursor += displayWidth + THUMB_GAP;
      return { boxWidth, boxHeight, scale: (displayHeight / boxHeight), centerX, displayWidth };
    });
    const selectedCenter = layout[selected]?.centerX || 0;
    const shift = frameSize.width / 2 - selectedCenter;
    return layout.map((l) => ({ ...l, x: l.centerX + shift }));
  }

  const thumbLayout = mode === "thumbs" ? getThumbLayout() : [];

  return (
    <div
      className={`project_gallery${images.length === 1 ? " no-gallery" : ""}`}
      ref={containerRef}
      onClick={(e) => {
        if (mode !== "single" || images.length < 2) return;
        if (justSwipedRef.current) {
          justSwipedRef.current = false;
          return;
        }
        const half = frameSize.width / 2;
        const clickX = e.clientX - containerRef.current.getBoundingClientRect().left;
        clickX < half ? goTo(selected - 1) : goTo(selected + 1);
      }}
    >
      {mode === "single" ? (
        <div className="project_gallery-track" ref={trackRef}>
          {images.map((item, i) => {
            const dims = item.image?.dimensions || { width: 0, height: 0 };
            const { width, height } = fittedSize(dims.width, dims.height);
            const offsetX = (i - selected) * frameSize.width;
            const left = frameSize.width / 2 - width / 2;
            const top = frameSize.height / 2 - height / 2;

            return (
              <div
                className="project_gallery-item"
                key={i}
                ref={i === 0 ? firstImageRef : undefined}
                style={{
                  translate: `${offsetX + left}px ${top}px`,
                  width: width || undefined,
                  height: height || undefined,
                }}
              >
                <PrismicImage
                  field={item.image}
                  className="hero"
                  loading="eager"
                  alt={item.alt || ""}
                  width={width || undefined}
                  height={height || undefined}
                  style={{
                    aspectRatio: dims.width && dims.height ? `${dims.width} / ${dims.height}` : undefined,
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="project_gallery-list visible">
          {images.map((item, i) => {
            const layout = thumbLayout[i] || { boxWidth: 0, boxHeight: 0, scale: 1, x: 0 };
            return (
              <div
                className={`real-item${i === selected ? " selected" : ""}${images.length > 1 ? " clickable" : ""}`}
                key={i}
                style={{
                  translate: `${Math.round(layout.x - layout.boxWidth / 2)}px -50%`,
                  scale: layout.scale,
                  width: layout.boxWidth || undefined,
                  height: layout.boxHeight || undefined,
                }}
                onClick={() => {
                  setSelected(i);
                  setMode("single");
                }}
              >
                <PrismicImage
                  field={item.image}
                  alt={item.alt || ""}
                  width={layout.boxWidth || undefined}
                  height={layout.boxHeight || undefined}
                />
              </div>
            );
          })}
        </div>
      )}

      {images.length > 1 && (
        <button
          className="project_thumbs-button"
          onClick={(e) => {
            e.stopPropagation();
            setMode(mode === "single" ? "thumbs" : "single");
          }}
          aria-label="Toggle thumbnail view"
        >
          <svg className="icon">
            <use xlinkHref={mode === "single" ? "#grid" : "#close"} />
          </svg>
        </button>
      )}

      <ProjectCursor
        containerRef={containerRef}
        mode={mode}
        hasNext={selected < images.length - 1}
        hasPrev={selected > 0}
      />

      {images.length > 1 && (
        <span
          className={`project_swipe${mode === "single" && !hasSwiped ? " visible" : ""}`}
        >
          Swipe to explore
          <svg className="icon">
            <use xlinkHref="#arrow-down" />
          </svg>
        </span>
      )}

      {context?.projectUid && (
        <HeroTransitionOverlay
          projectUid={context.projectUid}
          targetRef={firstImageRef}
        />
      )}
    </div>
  );
}

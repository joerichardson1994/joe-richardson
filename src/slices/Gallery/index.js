"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { PrismicImage } from "@prismicio/react";
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
  const dragState = useRef({ startX: 0, startY: 0, startTime: 0, axis: null, dragging: false });
  const justSwipedRef = useRef(false);

  const measure = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setFrameSize((prev) =>
      prev.width === rect.width && prev.height === rect.height
        ? prev
        : { width: rect.width, height: rect.height }
    );
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    measure();
  }, [mode, measure]);

  function goTo(index) {
    if (images.length === 0) return;
    setSelected((index + images.length) % images.length);
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "ArrowRight") goTo(selected + 1);
      if (e.key === "ArrowLeft") goTo(selected - 1);
      if (e.key === "Escape" && mode === "thumbs") setMode("single");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, mode, images.length]);

  const wheelLockRef = useRef(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || images.length < 2) return;

    function onWheel(e) {
      e.preventDefault();
      if (wheelLockRef.current) return;
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
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

  const dragSurfaceRef = useRef(null);
  const baseOffsetRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || images.length < 2) return;

    function getBaseOffset() {
      if (mode === "single") return -selected * frameSize.width;
      return frameSize.width / 2 - (thumbCentersRef.current[selected] || 0);
    }

    function onTouchStart(e) {
      const t = e.touches[0];
      dragState.current = {
        startX: t.clientX,
        startY: t.clientY,
        startTime: Date.now(),
        axis: null,
        dragging: false,
      };
      baseOffsetRef.current = getBaseOffset();
    }

    function onTouchMove(e) {
      const t = e.touches[0];
      const dx = t.clientX - dragState.current.startX;
      const dy = t.clientY - dragState.current.startY;

      if (!dragState.current.axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        dragState.current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (dragState.current.axis === "x") {
          dragState.current.dragging = true;
          setHasSwiped(true);
          const el = dragSurfaceRef.current;
          if (el) el.style.transition = "none";
        }
      }

      if (dragState.current.axis === "x") {
        e.preventDefault();
        const el = dragSurfaceRef.current;
        if (el) {
          const y = mode === "thumbs" ? ", -50%" : "";
          el.style.transform = `translate(${baseOffsetRef.current + dx}px${y})`;
        }
      }
    }

    function onTouchEnd(e) {
      if (dragState.current.axis !== "x") return;

      const t = e.changedTouches[0];
      const dx = t.clientX - dragState.current.startX;
      const elapsed = Date.now() - dragState.current.startTime;
      const velocity = Math.abs(dx) / Math.max(elapsed, 1);
      const threshold = mode === "single" ? frameSize.width * 0.2 : 40;
      const minVelocity = mode === "single" ? 0.5 : 0.35;
      const isSwipe = Math.abs(dx) > threshold || velocity > minVelocity;

      const el = dragSurfaceRef.current;
      if (el) el.style.transition = "";

      dragState.current.dragging = false;

      if (isSwipe) {
        if (dx < 0 && selected < images.length - 1) {
          justSwipedRef.current = true;
          goTo(selected + 1);
          return;
        } else if (dx > 0 && selected > 0) {
          justSwipedRef.current = true;
          goTo(selected - 1);
          return;
        }
      }
      if (el) el.style.transform = "";
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

  const THUMB_HEIGHT = Math.max(Math.round((frameSize.height || 400) * 0.32), 80);
  const THUMB_GAP = 16;

  const thumbWidths = useMemo(() => {
    return images.map((item) => {
      const dims = item.image?.dimensions || { width: 1, height: 1 };
      const aspect = dims.width / (dims.height || 1);
      return Math.max(Math.round(THUMB_HEIGHT * aspect), 20);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, THUMB_HEIGHT]);

  const thumbCenters = useMemo(() => {
    let cursor = 0;
    return thumbWidths.map((w) => {
      const center = cursor + w / 2;
      cursor += w + THUMB_GAP;
      return center;
    });
  }, [thumbWidths]);

  const thumbCentersRef = useRef(thumbCenters);
  thumbCentersRef.current = thumbCenters;

  const thumbStripOffset = frameSize.width / 2 - (thumbCenters[selected] || 0);

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
        <div
          className="project_gallery-track"
          ref={dragSurfaceRef}
          style={{
            transform: `translateX(${-selected * frameSize.width}px)`,
            transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            willChange: "transform",
            display: "flex",
            width: frameSize.width * images.length,
            height: "100%",
          }}
        >
          {images.map((item, i) => {
            const dims = item.image?.dimensions || { width: 0, height: 0 };
            const { width, height } = fittedSize(dims.width, dims.height);
            return (
              <div
                className="project_gallery-item"
                key={i}
                ref={i === 0 ? firstImageRef : undefined}
                style={{
                  width: frameSize.width || "100%",
                  height: "100%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PrismicImage
                  field={item.image}
                  className="hero"
                  alt={item.alt || ""}
                  width={width || undefined}
                  height={height || undefined}
                  loading="eager"
                  style={{
                    width: width || undefined,
                    height: height || undefined,
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    aspectRatio:
                      dims.width && dims.height ? `${dims.width} / ${dims.height}` : undefined,
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="project_gallery-list visible">
          <div
            ref={dragSurfaceRef}
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              display: "flex",
              alignItems: "center",
              gap: THUMB_GAP,
              transform: `translate(${thumbStripOffset}px, -50%)`,
              transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              willChange: "transform",
            }}
          >
            {images.map((item, i) => (
              <div
                key={i}
                className={`real-item${i === selected ? " selected" : ""}${
                  images.length > 1 ? " clickable" : ""
                }`}
                style={{
                  position: "static",
                  width: thumbWidths[i],
                  height: THUMB_HEIGHT,
                  flexShrink: 0,
                }}
                onClick={() => {
                  if (justSwipedRef.current) {
                    justSwipedRef.current = false;
                    return;
                  }
                  if (i === selected) {
                    setMode("single");
                  } else {
                    setSelected(i);
                  }
                }}
              >
                <PrismicImage
                  field={item.image}
                  alt={item.alt || ""}
                  width={thumbWidths[i]}
                  height={THUMB_HEIGHT}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

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

      <ProjectCursor
        containerRef={containerRef}
        mode={mode}
        hasNext={selected < images.length - 1}
        hasPrev={selected > 0}
      />

      {images.length > 1 && (
        <span className={`project_swipe${mode === "single" && !hasSwiped ? " visible" : ""}`}>
          Swipe to explore
          <svg className="icon">
            <use xlinkHref="#arrow-down" />
          </svg>
        </span>
      )}

      {context?.projectUid && (
        <HeroTransitionOverlay projectUid={context.projectUid} targetRef={firstImageRef} />
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  const [modeMorph, setModeMorph] = useState(null);
  const [morphClone, setMorphClone] = useState(null);

  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const firstImageRef = useRef(null);
  const currentImageRef = useRef(null);
  const thumbItemRefs = useRef({});
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

    function startDrag(clientX, clientY) {
      dragState.current = {
        startX: clientX,
        startY: clientY,
        startTime: Date.now(),
        axis: null,
        dragging: false,
      };
      baseOffsetRef.current = getBaseOffset();
    }

    function moveDrag(clientX, clientY, preventDefault) {
      const dx = clientX - dragState.current.startX;
      const dy = clientY - dragState.current.startY;

      if (!dragState.current.axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        dragState.current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (dragState.current.axis === "x") {
          dragState.current.dragging = true;
          setHasSwiped(true);
          const el = dragSurfaceRef.current;
          if (el) el.style.transition = "none";
          containerRef.current?.classList.add("dragging");
        }
      }

      if (dragState.current.axis === "x") {
        preventDefault?.();
        const el = dragSurfaceRef.current;
        if (el) {
          const y = mode === "thumbs" ? ", -50%" : "";
          el.style.transform = `translate(${baseOffsetRef.current + dx}px${y})`;
        }
      }
    }

    function endDrag(clientX) {
      if (dragState.current.axis !== "x") {
        containerRef.current?.classList.remove("dragging");
        return;
      }

      const dx = clientX - dragState.current.startX;
      const elapsed = Date.now() - dragState.current.startTime;
      const velocity = Math.abs(dx) / Math.max(elapsed, 1);
      const threshold = mode === "single" ? frameSize.width * 0.2 : 40;
      const minVelocity = mode === "single" ? 0.5 : 0.35;
      const isSwipe = Math.abs(dx) > threshold || velocity > minVelocity;

      dragState.current.dragging = false;
      const el = dragSurfaceRef.current;

      if (el) el.style.transition = "";
      containerRef.current?.classList.remove("dragging");

      if (isSwipe && ((dx < 0 && selected < images.length - 1) || (dx > 0 && selected > 0))) {
        justSwipedRef.current = true;
        goTo(selected + (dx < 0 ? 1 : -1));
      } else if (el) {
        el.style.transform = "";
      }
    }

    function onTouchStart(e) {
      const t = e.touches[0];
      startDrag(t.clientX, t.clientY);
    }
    function onTouchMove(e) {
      const t = e.touches[0];
      moveDrag(t.clientX, t.clientY, () => e.preventDefault());
    }
    function onTouchEnd(e) {
      const t = e.changedTouches[0];
      endDrag(t.clientX);
    }

    let mouseDown = false;
    function onMouseDown(e) {
      mouseDown = true;
      startDrag(e.clientX, e.clientY);
    }
    function onMouseMove(e) {
      if (!mouseDown) return;
      moveDrag(e.clientX, e.clientY, () => e.preventDefault());
    }
    function onMouseUp(e) {
      if (!mouseDown) return;
      mouseDown = false;
      endDrag(e.clientX);
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
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
        if (justSwipedRef.current) {
          justSwipedRef.current = false;
          return;
        }
        if (mode === "thumbs") {
          const hitThumb = e.target.closest?.(".real-item");
          if (!hitThumb) setMode("single");
          return;
        }
        if (images.length < 2) return;
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
            transition: "transform 0.6s cubic-bezier(0.47, 0, 0.23, 1.38)",
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
                style={{
                  width: frameSize.width || "100%",
                  height: "100%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  ref={(el) => {
                    if (i === 0) firstImageRef.current = el;
                    if (i === selected) currentImageRef.current = el;
                  }}
                  style={{
                    width: width || undefined,
                    height: height || undefined,
                    display: "flex",
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
              transition: "transform 0.6s cubic-bezier(0.47, 0, 0.23, 1.38)",
              willChange: "transform",
            }}
          >
            {images.map((item, i) => (
              <div
                key={i}
                ref={(el) => (thumbItemRefs.current[i] = el)}
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
          if (mode === "single") {
            const el = currentImageRef.current;
            const imgEl = el?.querySelector("img");
            if (el && imgEl) {
              const rect = el.getBoundingClientRect();
              setModeMorph({
                src: imgEl.currentSrc || imgEl.src,
                rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
              });
            }
            setMode("thumbs");
          } else {
            setMode("single");
          }
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

      {morphClone && (
        <div
          id="gallery-mode-morph-clone"
          style={{
            position: "fixed",
            top: morphClone.rect.top,
            left: morphClone.rect.left,
            width: morphClone.rect.width,
            height: morphClone.rect.height,
            zIndex: 10,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={morphClone.src}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      )}
    </div>
  );
}

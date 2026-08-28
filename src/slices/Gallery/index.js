"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PrismicImage } from "@prismicio/react";
import ProjectCursor from "./ProjectCursor";
import HeroTransitionOverlay from "@/components/HeroTransitionOverlay";

/**
 * Gallery - project page slice.
 *
 * Single view: each image explicitly sized in JS to fit the frame
 * (preserving aspect ratio), absolutely positioned, sliding via a
 * pixel transform.
 *
 * Thumbnail view: mirrors the reference theme's filmstrip - each
 * item is a fixed-size box (the image's natural intrinsic size)
 * centered inside a wrapper, and the wrapper itself is scaled down
 * and translated along the strip. The selected thumbnail renders
 * larger (scale 0.75) than the rest (scale 0.48).
 */
export default function Gallery({ slice, context }) {
  const images = slice.items || [];
  const [mode, setMode] = useState("single");
  const [selected, setSelected] = useState(0);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
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

  // --- Thumbnail filmstrip layout ---
  // Each thumbnail box is a fraction of the frame height (like the
  // reference theme's ~35% of viewport height), and items are laid
  // out left-to-right with a gap, centered around the selected item.
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
    // Recenter the whole strip so the selected item sits in the middle.
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
        const half = frameSize.width / 2;
        const clickX = e.clientX - containerRef.current.getBoundingClientRect().left;
        clickX < half ? goTo(selected - 1) : goTo(selected + 1);
      }}
    >
      {mode === "single" ? (
        <div className="project_gallery-track">
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
                  transform: `translate3d(${offsetX + left}px, ${top}px, 0)`,
                  width: width || undefined,
                  height: height || undefined,
                }}
              >
                <PrismicImage
                  field={item.image}
                  className="hero"
                  alt={item.alt || ""}
                  width={width || undefined}
                  height={height || undefined}
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
                  transform: `translate(${Math.round(layout.x - layout.boxWidth / 2)}px, -50%) scale(${layout.scale})`,
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

      {context?.projectUid && (
        <HeroTransitionOverlay
          projectUid={context.projectUid}
          targetRef={firstImageRef}
        />
      )}
    </div>
  );
}

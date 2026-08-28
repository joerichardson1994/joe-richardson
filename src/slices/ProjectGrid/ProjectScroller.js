"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PrismicImage } from "@prismicio/react";
import gsap from "gsap";

/**
 * Reimplementation of the original theme's homepage behaviour:
 *  - a scrollable list of project titles
 *  - a large hero image that swaps to match whichever title is
 *    "selected" (hovered on desktop, centred-in-viewport on mobile)
 *  - a category filter (desktop: inline links, mobile: fullscreen dropdown)
 *  - keyboard arrow navigation on desktop
 *
 * This intentionally trades the original's custom Fil Nomad router +
 * hand-rolled scroll physics for plain React state + GSAP tweens, so
 * it's easy to read/maintain, while keeping the same visual behaviour.
 */
export default function ProjectScroller({ heading, projects, categories }) {
  const router = useRouter();
  const [selected, setSelected] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  const heroRefs = useRef({});
  const listRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const visibleProjects = useMemo(() => {
    if (activeCategory === "All") return projects;
    return projects.filter((p) => p.data.category === activeCategory);
  }, [projects, activeCategory]);

  // Ensure `selected` always points at a currently-visible project.
  useEffect(() => {
    if (visibleProjects.length === 0) return;
    const stillVisible = visibleProjects.some(
      (p, i) => projects.indexOf(p) === selected
    );
    if (!stillVisible) {
      setSelected(projects.indexOf(visibleProjects[0]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleProjects]);

  // Swap the hero image instantly on selection change (no fade).
  useEffect(() => {
    Object.entries(heroRefs.current).forEach(([idx, el]) => {
      if (!el) return;
      const isActive = Number(idx) === selected;
      gsap.set(el, {
        autoAlpha: isActive ? 1 : 0,
        scale: 1,
      });
    });
  }, [selected]);

  // Desktop keyboard nav (Up/Down or Left/Right cycles through visible items)
  useEffect(() => {
    if (!isDesktop) return;
    function onKeyDown(e) {
      if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key))
        return;
      const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
      const currentPos = visibleProjects.findIndex(
        (p) => projects.indexOf(p) === selected
      );
      const nextPos =
        (currentPos + dir + visibleProjects.length) % visibleProjects.length;
      const next = visibleProjects[nextPos];
      if (next) setSelected(projects.indexOf(next));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDesktop, visibleProjects, selected, projects]);

  return (
    <>
      <div className="cat-indicator" />
      <div className="projects-box">
        <div className="projects-scroll" ref={listRef}>
          <ul
            className="projects-list"
            data-categories={categories.join(",")}
          >
            {heading && (
              <li className="projects-heading">
                <h1>{heading}</h1>
              </li>
            )}
            {projects.map((project, i) => {
              const isVisible = visibleProjects.includes(project);
              const isSelected = i === selected;
              return (
                <li
                  key={project.id}
                  className={`projects-item${isVisible ? " visible" : ""}${
                    isSelected ? " selected" : ""
                  }`}
                  data-categories={project.data.category}
                >
                  <h2
                    className="title"
                    data-filtered={!isVisible}
                    data-index={i}
                    onMouseEnter={() => isDesktop && isVisible && setSelected(i)}
                  >
                    <Link
                      href={`/projects/${project.uid}`}
                      onFocus={() => isVisible && setSelected(i)}
                      onClick={(e) => {
                        // On mobile, first tap selects; second tap (or tap-when-already-selected) navigates.
                        if (!isDesktop && !isSelected) {
                          e.preventDefault();
                          setSelected(i);
                        }
                      }}
                    >
                      {project.data.title}
                    </Link>
                  </h2>
                </li>
              );
            })}
          </ul>
        </div>

        {projects.map((project, i) => (
          <div className="projects_hero" key={project.id}>
            <div
              className="img_wrapper"
              ref={(el) => (heroRefs.current[i] = el)}
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                if (!isDesktop && i !== selected) {
                  setSelected(i);
                  return;
                }
                const imgEl = e.currentTarget.querySelector("img");
                if (imgEl) {
                  const rect = imgEl.getBoundingClientRect();
                  try {
                    sessionStorage.setItem(
                      "heroTransition",
                      JSON.stringify({
                        uid: project.uid,
                        src: imgEl.currentSrc || imgEl.src,
                        rect: {
                          top: rect.top,
                          left: rect.left,
                          width: rect.width,
                          height: rect.height,
                        },
                      })
                    );
                  } catch {
                    // sessionStorage unavailable - fall through to plain nav
                  }
                }
                router.push(`/projects/${project.uid}`);
              }}
            >
              <PrismicImage
                field={project.data.cover_image}
                className={`projects-hero${i === selected ? " visible" : ""}`}
              />
            </div>
          </div>
        ))}

        <span className="scroll-message visible">Scroll to continue</span>
      </div>

      {/* Category filter: rendered via portal-less direct placement.
          On desktop this renders inline; on mobile it's a fullscreen list.
          It targets the fixed grid area reserved by SiteChrome. */}
      <CategoryFilter
        categories={categories}
        active={activeCategory}
        onChange={(cat) => {
          setActiveCategory(cat);
          setDropdownOpen(false);
        }}
        open={dropdownOpen}
        onToggle={() => setDropdownOpen((v) => !v)}
      />
    </>
  );
}

function CategoryFilter({ categories, active, onChange, open, onToggle }) {
  const [mountEl, setMountEl] = useState(null);

  useEffect(() => {
    setMountEl(document.getElementById("category-filter-mount"));
  }, []);

  const content = (
    <>
      <button
        className="category_filter-button"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span>{active}</span>
        <svg className="icon">
          <use xlinkHref="#chevron-down" />
        </svg>
      </button>
      <ul className={`category_filter-list${open ? " visible" : ""}`}>
        <li className="category_filter-item">
          <a
            href="javascript:void(0);"
            className={active === "All" ? "active" : ""}
            onClick={() => onChange("All")}
          >
            All
          </a>
        </li>
        {categories.map((cat) => (
          <li className="category_filter-item" key={cat}>
            <a
              href="javascript:void(0);"
              className={active === cat ? "active" : ""}
              onClick={() => onChange(cat)}
            >
              {cat}
            </a>
          </li>
        ))}
      </ul>
    </>
  );

  if (!mountEl) return null;

  // Mirror markup into the fixed-position mount point declared in SiteChrome,
  // and toggle the `.disabled` class Prismic/CSS expects for visibility.
  mountEl.classList.toggle("disabled", categories.length === 0);

  return createPortal(content, mountEl);
}

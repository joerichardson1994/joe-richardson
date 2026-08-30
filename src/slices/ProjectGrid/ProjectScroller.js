"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PrismicImage } from "@prismicio/react";
import gsap from "gsap";

export default function ProjectScroller({ heading, projects, categories }) {
  const router = useRouter();
  const [selected, setSelected] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  const heroRefs = useRef({});
  const listRef = useRef(null);
  const itemRefs = useRef({});

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

  useEffect(() => {
    if (isDesktop) return;
    const entries = Object.entries(itemRefs.current).filter(([, el]) => el);
    if (entries.length === 0) return;

    let observer;
    const raf = requestAnimationFrame(() => {
      observer = new IntersectionObserver(
        (observed) => {
          let best = null;
          let bestRatio = 0;
          observed.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
              bestRatio = entry.intersectionRatio;
              best = entry.target;
            }
          });
          if (best) {
            const idx = Number(best.dataset.index);
            const project = projects[idx];
            if (project && visibleProjects.includes(project)) {
              setSelected(idx);
            }
          }
        },
        {
          rootMargin: "-45% 0px -45% 0px",
          threshold: Array.from({ length: 21 }, (_, i) => i / 20),
        }
      );
      entries.forEach(([, el]) => observer.observe(el));
    });

    return () => {
      cancelAnimationFrame(raf);
      if (observer) observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop, visibleProjects]);

  useEffect(() => {
    Object.entries(heroRefs.current).forEach(([idx, el]) => {
      if (!el) return;
      const isActive = Number(idx) === selected;
      gsap.set(el, { autoAlpha: isActive ? 1 : 0 });
    });
  }, [selected]);

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
                  ref={(el) => (itemRefs.current[i] = el)}
                  data-index={i}
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
                    // sessionStorage unavailable - fall through
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
          <button
            type="button"
            className={active === "All" ? "active" : "inactive"}
            onClick={() => onChange("All")}
          >
            All
          </button>
        </li>
        {categories.map((cat) => (
          <li className="category_filter-item" key={cat}>
            <button
              type="button"
              className={active === cat ? "active" : "inactive"}
              onClick={() => onChange(cat)}
            >
              {cat}
            </button>
          </li>
        ))}
      </ul>
    </>
  );

  if (!mountEl) return null;

  mountEl.classList.toggle("disabled", categories.length === 0);

  return createPortal(content, mountEl);
}

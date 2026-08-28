"use client";

import { useState } from "react";
import Link from "next/link";
import { PrismicLink } from "@prismicio/react";

/**
 * Site-wide chrome: logo, top-right nav, mobile hamburger drawer.
 * The category filter itself is rendered by the ProjectGrid slice
 * (it only makes sense on the homepage), but the fixed grid area
 * for it lives in globals.css (`.category_filter`).
 */
export default function SiteChrome({ navigation, settings }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const links = navigation?.data?.links || [];
  const logoText = navigation?.data?.logo_text || settings?.data?.site_title || "Portfolio";

  return (
    <>
      <div className="site_grid">
        <Link href="/" className="main_logo">
          {logoText}
        </Link>

        <div className="secondary_nav">
          <ul className="nav-list">
            {links.map((item, i) => (
              <li className="nav-item" key={i}>
                <PrismicLink field={item.link}>{item.label}</PrismicLink>
              </li>
            ))}
          </ul>

          <button
            className="main_nav-button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <svg className="icon">
              <use xlinkHref="#hamburger" />
            </svg>
          </button>
        </div>

        {/* Placeholder mount point: the ProjectGrid slice injects the
            active category filter markup here on the homepage only. */}
        <div className="category_filter disabled" id="category-filter-mount" />
      </div>

      <nav className={`main_nav-layer${drawerOpen ? " open" : ""}`} id="nav-drawer">
        <button
          className="main_nav-close"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
        >
          <span>Close</span>
          <svg className="icon">
            <use xlinkHref="#close" />
          </svg>
        </button>
        <ul className="nav-list">
          {links.map((item, i) => (
            <li className="nav-item" key={i}>
              <PrismicLink field={item.link} onClick={() => setDrawerOpen(false)}>
                {item.label}
              </PrismicLink>
            </li>
          ))}
        </ul>
      </nav>

      {drawerOpen && (
        <div className="nav-scrim" onClick={() => setDrawerOpen(false)} />
      )}
    </>
  );
}

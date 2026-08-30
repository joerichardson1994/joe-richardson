"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PrismicLink } from "@prismicio/react";
import { asLink } from "@prismicio/client";

export default function SiteChrome({ navigation, settings }) {
  const pathname = usePathname();
  const links = navigation?.data?.links || [];
  const logoText = navigation?.data?.logo_text || settings?.data?.site_title || "Portfolio";

  function isActive(link) {
    const href = asLink(link);
    if (!href) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="site_grid">
      <Link href="/" className="main_logo">
        {logoText}
      </Link>

      <div className="secondary_nav">
        <ul className="nav-list">
          {links.map((item, i) => (
            <li className="nav-item" key={i}>
              <PrismicLink
                field={item.link}
                className={isActive(item.link) ? "active" : undefined}
              >
                {item.label}
              </PrismicLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="category_filter disabled" id="category-filter-mount" />
    </div>
  );
}

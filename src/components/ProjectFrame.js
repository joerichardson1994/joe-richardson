"use client";

import { useState } from "react";
import Link from "next/link";
import { PrismicRichText } from "@prismicio/react";

export default function ProjectFrame({ project, children }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const { title, subtitle, year, description, credits } = project.data;

  return (
    <div className="project_frame" data-template="project">
      <div className="project_gallery-wrap">{children}</div>

      <div className="project_controls visible">
        <div className="project_heading visible">
          <h1>{title}</h1>
          {subtitle && <h2>{subtitle}</h2>}
          {year && <span className="project_year">{year}</span>}
        </div>

        <div className="project_foot visible">
          <div className="project_info">
            <button
              className="project_info-trigger"
              onClick={() => setInfoOpen((v) => !v)}
            >
              Info
            </button>
          </div>
          <Link href="/" className="project_back">
            &larr; Back to projects
          </Link>
        </div>
      </div>

      <div className={`project_info-card${infoOpen ? " visible" : ""}`}>
        <div className="project_info-head">
          <div className="heading">
            <h1>{title}</h1>
            {subtitle && <h2>{subtitle}</h2>}
          </div>
          <button
            className="project_info-close"
            onClick={() => setInfoOpen(false)}
            aria-label="Close"
          >
            <svg className="icon">
              <use xlinkHref="#close" />
            </svg>
          </button>
        </div>
        <div className="project_info-body">
          <div className="text">
            <PrismicRichText field={description} />
            <PrismicRichText field={credits} />
          </div>
        </div>
      </div>
    </div>
  );
}

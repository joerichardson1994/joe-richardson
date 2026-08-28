import { PrismicRichText } from "@prismicio/react";

export default function TextBlock({ slice }) {
  if (slice.variation === "pullQuote") {
    return (
      <blockquote className="project_pull-quote">
        <PrismicRichText field={slice.primary.content} />
        {slice.primary.attribution && (
          <cite>{slice.primary.attribution}</cite>
        )}
      </blockquote>
    );
  }

  return (
    <div className="project_text-block">
      <PrismicRichText field={slice.primary.content} />
    </div>
  );
}

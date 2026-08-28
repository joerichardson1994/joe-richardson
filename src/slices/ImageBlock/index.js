import { PrismicImage } from "@prismicio/react";

export default function ImageBlock({ slice }) {
  if (slice.variation === "sideBySide") {
    return (
      <div className="project_image-pair">
        <PrismicImage field={slice.primary.image_left} />
        <PrismicImage field={slice.primary.image_right} />
      </div>
    );
  }

  return (
    <figure className="project_image-single">
      <PrismicImage field={slice.primary.image} />
      {slice.primary.caption && <figcaption>{slice.primary.caption}</figcaption>}
    </figure>
  );
}

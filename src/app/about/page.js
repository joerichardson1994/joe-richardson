import { createClient } from "@/lib/prismicio";
import { PrismicRichText, PrismicImage } from "@prismicio/react";
import { notFound } from "next/navigation";
import Link from "next/link";

export async function generateMetadata() {
  const client = createClient();
  const page = await client.getSingle("about").catch(() => null);
  if (!page) return {};
  return {
    title: page.data.meta_title || "About",
    description: page.data.meta_description,
  };
}

export default async function AboutPage() {
  const client = createClient();
  const page = await client.getSingle("about").catch(() => null);
  if (!page) return notFound();

  return (
    <div className="about-page" data-template="about">
      <div className="about-content">
        <div className="about-hero">
          <PrismicImage field={page.data.portrait} />
        </div>
        <div className="about-text">
          <PrismicRichText field={page.data.body_text} />
        </div>
        <Link href="/" className="about-back">
          &larr; Back
        </Link>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/prismicio";
import { SliceZone } from "@prismicio/react";
import { components } from "@/slices";
import { notFound } from "next/navigation";
import ProjectFrame from "@/components/ProjectFrame";

export async function generateStaticParams() {
  const client = createClient();
  const projects = await client.getAllByType("project");
  return projects.map((p) => ({ uid: p.uid }));
}

export async function generateMetadata({ params }) {
  const client = createClient();
  const page = await client.getByUID("project", params.uid).catch(() => null);
  if (!page) return {};

  return {
    title: page.data.meta_title || page.data.title,
    description: page.data.meta_description,
    openGraph: {
      images: page.data.cover_image?.url ? [page.data.cover_image.url] : [],
    },
  };
}

export default async function ProjectPage({ params }) {
  const client = createClient();
  const page = await client.getByUID("project", params.uid).catch(() => null);

  if (!page) return notFound();

  return (
    <ProjectFrame project={page}>
      <SliceZone
        slices={page.data.slices}
        components={components}
        context={{ projectUid: page.uid }}
      />
    </ProjectFrame>
  );
}

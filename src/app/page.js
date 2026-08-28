import { createClient } from "@/lib/prismicio";
import { SliceZone } from "@prismicio/react";
import { components } from "@/slices";
import { notFound } from "next/navigation";

export default async function HomePage() {
  const client = createClient();
  const page = await client.getSingle("homepage").catch(() => null);

  if (!page) return notFound();

  return (
    <main className="home_content" data-template="landing">
      <SliceZone slices={page.data.slices} components={components} />
    </main>
  );
}

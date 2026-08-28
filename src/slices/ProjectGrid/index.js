import { createClient } from "@/lib/prismicio";
import ProjectScroller from "./ProjectScroller";

/**
 * ProjectGrid — homepage slice.
 * If "auto_list_all_projects" is true (default), fetches every published
 * Project doc. Otherwise uses the manually-selected items in the slice.
 */
export default async function ProjectGrid({ slice }) {
  const client = createClient();
  let projects = [];

  if (slice.primary.auto_list_all_projects !== false) {
    projects = await client.getAllByType("project", {
      orderings: [{ field: "my.project.year", direction: "desc" }],
    });
  } else {
    const uids = (slice.items || [])
      .map((item) => item.project?.uid)
      .filter(Boolean);

    if (uids.length) {
      const fetched = await client.getAllByUIDs("project", uids).catch(() => []);
      // preserve the editor's manual ordering
      projects = uids
        .map((uid) => fetched.find((p) => p.uid === uid))
        .filter(Boolean);
    }
  }

  const categories = Array.from(
    new Set(projects.map((p) => p.data.category).filter(Boolean))
  );

  return (
    <ProjectScroller
      heading={slice.primary.heading}
      projects={projects}
      categories={categories}
    />
  );
}

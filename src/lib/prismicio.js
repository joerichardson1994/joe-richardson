import * as prismic from "@prismicio/client";
import * as prismicNext from "@prismicio/next";
import config from "../../slicemachine.config.json";

/** @type {prismic.ClientConfig} */
export const repositoryName = process.env.NEXT_PUBLIC_PRISMIC_ENVIRONMENT || config.repositoryName;

export const routes = [
  { type: "homepage", path: "/" },
  { type: "project", path: "/projects/:uid" },
  { type: "about", path: "/about" },
];

export function createClient(config = {}) {
  const client = prismic.createClient(repositoryName, {
    routes,
    fetchOptions:
      process.env.NODE_ENV === "production"
        ? { next: { tags: ["prismic"] }, cache: "force-cache" }
        : { next: { revalidate: 5 } },
    ...config,
  });

  prismicNext.enableAutoPreviews({ client });

  return client;
}

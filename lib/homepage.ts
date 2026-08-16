import type { Post } from "@/lib/content";

/** Manually curated article slugs for the homepage's Selected Writing section. */
export const selectedWritingSlugs = [
  "understanding-rag-systems",
  "designing-for-failure-in-small-systems",
  "how-to-read-a-research-paper-as-an-engineer",
] as const;

export function getSelectedPosts(posts: Post[]) {
  return selectedWritingSlugs
    .map((slug) => posts.find((post) => post.slug === slug))
    .filter((post): post is Post => Boolean(post))
    .slice(0, 3);
}

import { categoryMeta, type CategorySlug } from "@/lib/site";

const categorySlugs = Object.keys(categoryMeta) as CategorySlug[];
function normalizeTopicLabel(value: string) { return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export function getTopicHref(label: string) {
  const normalized = normalizeTopicLabel(label);
  const category = categorySlugs.find((slug) => slug === normalized || normalizeTopicLabel(categoryMeta[slug].name) === normalized || normalizeTopicLabel(categoryMeta[slug].shortName) === normalized);
  return category ? `/topics/${category}` : undefined;
}

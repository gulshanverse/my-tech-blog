import Link from "next/link";
import type { CategorySlug } from "@/lib/site";
import { getTopicHref } from "@/lib/topic-links";

type RelatedTopicsProps = {
  categoryLabel: string;
  categorySlug: CategorySlug;
  tags: string[];
};

export function RelatedTopics({ categoryLabel, categorySlug, tags }: RelatedTopicsProps) {
  const labels = Array.from(new Set([categoryLabel, ...tags]));
  return <section className="related-topics" aria-labelledby="related-topics-heading"><div className="related-topics-label" id="related-topics-heading">Related topics</div><div className="related-topics-list">{labels.map((label) => { const href = label === categoryLabel ? `/topics/${categorySlug}` : getTopicHref(label); return href ? <Link className="tag related-topics-tag" href={href} key={label}>{label}</Link> : <span className="tag related-topics-tag" key={label}>{label}</span>; })}</div></section>;
}

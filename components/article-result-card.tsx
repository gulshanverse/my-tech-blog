import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categoryMeta, type CategorySlug } from "@/lib/site";
import type { Post } from "@/lib/content";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
}

export function ArticleResultCard({ post }: { post: Post }) {
  const category = categoryMeta[post.category as CategorySlug];
  return <Link className="post-card" href={`/blog/${post.slug}`}><div className="card-meta"><span className="category">{category?.shortName}</span><span>·</span><span>{formatDate(post.date)}</span><span>·</span><span>{post.readingTime}</span></div><h3>{post.title}</h3><p className="card-description">{post.description}</p><span className="card-arrow">Open article <ArrowUpRight size={15} /></span></Link>;
}

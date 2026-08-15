import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { type Post, formatDate, getCategory } from "@/lib/content";

export function ArticleCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  const category = getCategory(post.category);
  return <Link className={featured ? "feature-card" : "post-card"} href={`/blog/${post.slug}`}><div className="feature-art" aria-hidden="true"><span>{category?.shortName || "Writing"}</span></div><div className="card-meta"><span className="category">{category?.name}</span><span>·</span><span>{formatDate(post.date)}</span><span>·</span><span>{post.readingTime}</span></div><h3>{post.title}</h3><p className="card-description">{post.description}</p><span className="card-arrow">Read the piece <ArrowUpRight size={15} /></span></Link>;
}

export function ArticleCardRow({ post }: { post: Post }) {
  const category = getCategory(post.category);
  return <Link className="post-card" href={`/blog/${post.slug}`}><div className="card-meta"><span className="category">{category?.shortName}</span><span>·</span><span>{formatDate(post.date)}</span><span>·</span><span>{post.readingTime}</span></div><h3>{post.title}</h3><p className="card-description">{post.description}</p><span className="card-arrow">Open article <ArrowUpRight size={15} /></span></Link>;
}

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { type Post, formatDate, formatReadingTime, getCategory } from "@/lib/content";

export function ArticleCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  const category = getCategory(post.category);
  return <Link className={featured ? "feature-card" : "post-card"} href={`/blog/${post.slug}`}><div className="feature-art"><Image src={post.coverImage} alt="" fill sizes={featured ? "(max-width: 900px) 100vw, 52vw" : "(max-width: 900px) 100vw, 30vw"} className="cover-image" /><span>{category?.shortName || "Writing"}</span></div><div className="card-meta"><span className="category">{category?.name}</span><span>·</span><span>{formatDate(post.date)}</span><span>·</span><span>{formatReadingTime(post.readingTime)}</span></div><h3>{post.title}</h3><p className="card-description">{post.description}</p><span className="card-arrow">Read the piece <ArrowUpRight size={15} /></span></Link>;
}

export function ArticleCardRow({ post }: { post: Post }) {
  const category = getCategory(post.category);
  return <Link className="post-card" href={`/blog/${post.slug}`}><div className="article-thumb"><Image src={post.coverImage} alt="" fill sizes="(max-width: 620px) 100vw, (max-width: 1100px) 50vw, 33vw" className="cover-image" /></div><div className="card-meta"><span className="category">{category?.shortName}</span><span>·</span><span>{formatDate(post.date)}</span><span>·</span><span>{formatReadingTime(post.readingTime)}</span></div><h3>{post.title}</h3><p className="card-description">{post.description}</p><span className="card-arrow">Open article <ArrowUpRight size={15} /></span></Link>;
}

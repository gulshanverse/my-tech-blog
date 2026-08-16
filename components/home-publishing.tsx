import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { formatDate, getCategory, type Post } from "@/lib/content";
import { getSelectedPosts } from "@/lib/homepage";

export function SelectedWriting({ posts }: { posts: Post[] }) {
  const selected = getSelectedPosts(posts);
  if (!selected.length) return null;

  return <section className="section" aria-labelledby="selected-writing-heading"><div className="container"><div className="section-heading"><div><div className="eyebrow">02 / Selected writing</div><h2 id="selected-writing-heading">A few things worth<br />reading.</h2></div><Link className="section-link" href="/blog">View all writing <ArrowUpRight size={15} /></Link></div><div className="post-grid selected-writing-grid">{selected.map((post) => <ArticleCard key={post.slug} post={post} />)}</div></div></section>;
}

export function LatestWriting({ posts, limit = 5 }: { posts: Post[]; limit?: number }) {
  const latest = posts.slice(0, limit);

  return <section className="section soft-section" aria-labelledby="latest-writing-heading"><div className="container"><div className="section-heading"><div><div className="eyebrow">03 / Latest writing</div><h2 id="latest-writing-heading">The newest<br />notes.</h2></div><p>Recent pieces from the archive, ordered simply by when they were published.</p></div><div className="latest-writing-list">{latest.map((post) => { const category = getCategory(post.category); return <Link className="latest-writing-row" href={`/blog/${post.slug}`} key={post.slug}><time className="latest-writing-date" dateTime={post.date}>{formatDate(post.date)}</time><span className="latest-writing-body"><strong>{post.title}</strong><span className="latest-writing-meta">{category?.shortName || "Writing"} <span aria-hidden="true">·</span> {post.readingTime}</span></span><span className="latest-writing-link">Read <ArrowUpRight size={15} /></span></Link>; })}</div></div></section>;
}

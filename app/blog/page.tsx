import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCardRow } from "@/components/article-card";
import { SearchBox } from "@/components/search-box";
import { categoryMeta } from "@/lib/site";
import { getAllPosts } from "@/lib/content";

export const metadata: Metadata = { title: "Blog", description: "Technical deep dives, experiments, research notes, projects, and lessons from building with technology." };

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const posts = getAllPosts();
  const { category } = await searchParams;
  const filtered = category && category in categoryMeta ? posts.filter((post) => post.category === category) : posts;
  return <><section className="page-hero"><div className="container"><div className="eyebrow">The archive</div><h1>Ideas, experiments,<br /><span className="serif">technical deep dives.</span></h1><p>A growing record of what I&apos;m learning, building, and trying to understand about AI, software, and technology.</p></div></section><section className="section"><div className="container"><div className="archive-toolbar"><span className="archive-count">{filtered.length} published {filtered.length === 1 ? "piece" : "pieces"}</span><SearchBox /></div><div className="filter-row"><Link className={!category ? "filter-chip active" : "filter-chip"} href="/blog">All writing</Link>{Object.values(categoryMeta).map((item) => <Link className={category === item.slug ? "filter-chip active" : "filter-chip"} href={`/blog?category=${item.slug}`} key={item.slug}>{item.shortName}</Link>)}</div>{filtered.length ? <div className="post-grid">{filtered.map((post) => <ArticleCardRow key={post.slug} post={post} />)}</div> : <div className="empty-state"><h2>No posts in this topic yet.</h2><p>That thread is still being written. Try another category.</p></div>}</div></section></>;
}

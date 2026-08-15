import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCardRow } from "@/components/article-card";
import { getAllPosts, getCategory } from "@/lib/content";
import { categoryMeta } from "@/lib/site";

export function generateStaticParams() { return Object.keys(categoryMeta).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const category = getCategory(slug); return category ? { title: category.name, description: category.description } : {}; }

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const category = getCategory(slug); if (!category) notFound(); const posts = getAllPosts().filter((post) => post.category === slug); return <><section className="page-hero"><div className="container"><div className="eyebrow">Topic / {category.shortName}</div><h1>{category.name}</h1><p>{category.description}</p></div></section><section className="section"><div className="container"><div className="archive-toolbar"><span className="archive-count">{posts.length} {posts.length === 1 ? "piece" : "pieces"} in this topic</span><Link className="section-link" href="/topics">All topics ↗</Link></div>{posts.length ? <div className="post-grid">{posts.map((post) => <ArticleCardRow post={post} key={post.slug} />)}</div> : <div className="empty-state"><h2>This topic is still taking shape.</h2><p>New notes will appear here as the archive grows.</p></div>}</div></section></>; }

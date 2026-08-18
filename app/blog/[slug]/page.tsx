import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/article-body";
import { FeedbackReactions } from "@/components/feedback-reactions";
import { RelatedArticles } from "@/components/related-articles";
import { RelatedTopics } from "@/components/related-topics";
import { ReadingProgress } from "@/components/reading-progress";
import { TableOfContents } from "@/components/toc";
import { getAllPosts, getCategory, getPost, getRelatedRecommendations, getToc, formatDate, formatReadingTime } from "@/lib/content";
import { siteConfig } from "@/lib/site";

export function generateStaticParams() { return getAllPosts().map((post) => ({ slug: post.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const category = getCategory(post.category);
  const canonicalUrl = `${siteConfig.url}/blog/${post.slug}`;
  const imageUrl = `${canonicalUrl}/opengraph-image`;
  return { title: post.seoTitle || post.title, description: post.seoDescription || post.description, authors: [{ name: post.author }], alternates: { canonical: canonicalUrl }, openGraph: { type: "article", url: canonicalUrl, title: post.title, description: post.description, publishedTime: post.date, modifiedTime: post.updatedAt || post.date, authors: [post.author], section: category?.name, tags: post.tags, images: [{ url: imageUrl, width: 1200, height: 630, alt: post.coverAlt || `${post.title} — ${siteConfig.name}` }] }, twitter: { card: "summary_large_image", title: post.title, description: post.description, images: [imageUrl] } };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post || post.status !== "published") notFound();
  const category = getCategory(post.category);
  const toc = getToc(post.content);
  const related = getRelatedRecommendations(post);
  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: post.title, description: post.description, datePublished: post.date, dateModified: post.updatedAt || post.date, author: { "@type": "Person", name: post.author, url: siteConfig.url }, mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}` };
  return <><ReadingProgress /><article className="article-shell"><div className="container"><header className="article-header"><div className="eyebrow">{category?.name}</div><h1>{post.title}</h1><p className="article-dek">{post.description}</p><div className="article-meta"><span className="author-dot" aria-hidden="true" /><span>{post.author}</span><span>·</span><span>Published <time dateTime={post.date}>{formatDate(post.date)}</time></span>{post.updatedAt && <><span>·</span><span>Updated <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time></span></>}{formatReadingTime(post.readingTime) && <><span>·</span><span>{formatReadingTime(post.readingTime)}</span></>}{post.difficulty && <><span>·</span><span>{post.difficulty}</span></>}</div></header><div className="article-cover"><Image src={post.coverImage} alt={post.coverAlt || `Editorial visual representing ${post.title}`} fill priority sizes="(max-width: 900px) 100vw, 1100px" className="cover-image" /><span className="article-cover-label">{category?.shortName} / field notes</span></div><div className={`article-layout${toc.length >= 2 ? "" : " article-layout--full"}`}><TableOfContents items={toc} /><div className="article-prose"><ArticleBody source={post.content} /><div className="article-footer"><div className="author-card"><div className="author-avatar">GK</div><div><h3>Gulshan Kumar</h3><p>3rd Year B.Tech Undergraduate in Information Technology. Writing about AI, software engineering, projects, and technology.</p><div className="author-links"><a href={siteConfig.links.github} target="_blank" rel="noreferrer">GitHub</a><a href="/about">About</a><a href={siteConfig.links.email}>Email</a></div></div></div><RelatedTopics categoryLabel={category?.shortName || post.category} categorySlug={post.category} tags={post.tags} /><RelatedArticles recommendations={related} /><FeedbackReactions slug={post.slug} /></div></div></div></div></article><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /></>;
}

import type { Metadata } from "next";
import { ArticleExplorer } from "@/components/article-explorer";
import { categoryMeta } from "@/lib/site";
import { getAllPosts, getAllTags } from "@/lib/content";

export const metadata: Metadata = { title: "Search", description: "Search Gulshan Kumar's technical writing by title, description, content, category, and tags." };

type SearchParams = { q?: string; category?: string; tag?: string };

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const posts = getAllPosts();
  const { q = "", category = "", tag = "" } = await searchParams;
  const categories = Object.values(categoryMeta).map((item) => ({ slug: item.slug, shortName: item.shortName }));

  return <><section className="page-hero"><div className="container"><div className="eyebrow">The archive search</div><h1>Find the<br /><span className="serif">useful thread.</span></h1><p>Search across titles, descriptions, article content, categories, and tags. Results update instantly as you type.</p></div></section><section className="section"><div className="container"><ArticleExplorer posts={posts} categories={categories} tags={getAllTags()} initialQuery={q} initialCategory={category} initialTag={tag} mode="search" /></div></section></>;
}

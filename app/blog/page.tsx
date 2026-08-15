import type { Metadata } from "next";
import { ArticleExplorer } from "@/components/article-explorer";
import { categoryMeta } from "@/lib/site";
import { getAllPosts, getAllTags } from "@/lib/content";

export const metadata: Metadata = { title: "Blog", description: "Technical deep dives, experiments, research notes, projects, and lessons from building with technology." };

type BlogSearchParams = { category?: string; q?: string; tag?: string };

export default async function BlogPage({ searchParams }: { searchParams: Promise<BlogSearchParams> }) {
  const posts = getAllPosts();
  const { category = "", q = "", tag = "" } = await searchParams;
  const categories = Object.values(categoryMeta).map((item) => ({ slug: item.slug, shortName: item.shortName }));

  return <><section className="page-hero"><div className="container"><div className="eyebrow">The archive</div><h1>Ideas, experiments,<br /><span className="serif">technical deep dives.</span></h1><p>A growing record of what I&apos;m learning, building, and trying to understand about AI, software, and technology.</p></div></section><section className="section"><div className="container"><ArticleExplorer posts={posts} categories={categories} tags={getAllTags()} initialQuery={q} initialCategory={category} initialTag={tag} /></div></section></>;
}

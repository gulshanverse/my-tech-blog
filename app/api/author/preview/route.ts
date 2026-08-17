import { NextResponse } from "next/server";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { serialize } from "next-mdx-remote/serialize";
import { hasAuthorSession } from "@/lib/author-auth";
import { getAllPosts, getCategory, getRelatedRecommendations, getToc, type Post } from "@/lib/content";
import type { ArticleDraftInput } from "@/lib/author-articles";

export async function POST(request: Request) {
  if (!(await hasAuthorSession())) return NextResponse.json({ error: "Author Studio access is required." }, { status: 401 });
  try {
    const input = await request.json() as ArticleDraftInput;
    const tags = String(input.tags || "").split(/[,\n]/).map((tag) => tag.trim()).filter(Boolean);
    const previewPost: Post = { slug: input.slug || "preview", title: input.title || "Untitled article", description: input.description || "", date: input.date || new Date().toISOString().slice(0, 10), updatedAt: input.updatedAt || undefined, category: input.category, tags, author: "Gulshan Kumar", readingTime: input.readingTime || "", difficulty: input.difficulty || undefined, coverImage: input.coverImage || "", coverAlt: input.coverAlt, featured: Boolean(input.featured), status: input.status || "draft", content: input.content || "" };
    const compiled = await serialize(input.content || "Write your article content to preview it here.", { blockJS: true, blockDangerousJS: true, mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug, [rehypePrettyCode, { theme: "github-dark-dimmed" }]] } });
    const category = getCategory(input.category);
    return NextResponse.json({ serialized: compiled, toc: getToc(previewPost.content), category: { name: category?.name, shortName: category?.shortName }, recommendations: getRelatedRecommendations(previewPost) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Preview compilation failed." }, { status: 400 }); }
}

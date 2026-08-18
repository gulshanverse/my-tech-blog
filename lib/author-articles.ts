import matter from "gray-matter";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { compileMDX } from "next-mdx-remote/rsc";
import { categoryMeta, type CategorySlug } from "@/lib/site";
import { emptyDraftInput, normalizeDraftInput, type ArticleDraftInput, type DraftInputLike, todayIso } from "@/lib/article-draft";
export { emptyDraftInput, normalizeDraftInput, type ArticleDraftInput, type DraftInputLike, todayIso } from "@/lib/article-draft";
import { parsePostSource, type Post, type PostStatus } from "@/lib/content";
import { normalizeDifficulty, parseReadingTime, type Difficulty } from "@/lib/article-metadata";
import { getGithubFile, listGithubArticlePaths } from "@/lib/github-content";

export type AuthorArticle = { post: Post; path: string; sha: string; source: string };

const categories = Object.keys(categoryMeta) as CategorySlug[];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const articlePathPattern = /^content\/blog\/(ai|engineering|programming|research|projects|learning)\/[a-z0-9]+(?:-[a-z0-9]+)*\.mdx$/;

export function isArticlePath(path: string) { return articlePathPattern.test(path); }

export function articlePath(category: CategorySlug, slug: string) {
  return `content/blog/${category}/${slug}.mdx`;
}

function safeString(value: unknown) { return value === null || value === undefined ? "" : String(value); }

export function tagsFromInput(tags: unknown) {
  const raw = Array.isArray(tags) ? tags.map(safeString).join(", ") : safeString(tags);
  const seen = new Set<string>();
  return raw.split(/[,\n]/).map((tag) => tag.trim()).filter(Boolean).filter((tag) => { const key = tag.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; });
}

export function tagsToInput(tags: unknown) {
  return Array.isArray(tags) ? tags.map(safeString).join(", ") : safeString(tags);
}

export function postToDraftInput(post: Post): ArticleDraftInput {
  return normalizeDraftInput({ title: post.title, slug: post.slug, category: post.category, tags: tagsToInput(post.tags), description: post.description, coverImage: post.coverImage, coverAlt: post.coverAlt || `Editorial visual representing ${post.title}`, readingTime: String(post.readingTime), difficulty: post.difficulty, status: post.status, content: post.content, date: post.date || todayIso(), updatedAt: post.updatedAt || "", featured: post.featured });
}

export function draftToSource(input: ArticleDraftInput) {
  const data: Record<string, unknown> = { title: input.title, description: input.description, date: input.date, category: input.category, tags: tagsFromInput(input.tags), author: "Gulshan Kumar", readingTime: parseReadingTime(input.readingTime) ?? input.readingTime, featured: input.featured, status: input.status };
  if (input.coverImage) data.coverImage = input.coverImage;
  if (input.coverAlt) data.coverAlt = input.coverAlt;
  if (input.updatedAt) data.updatedAt = input.updatedAt;
  if (input.difficulty) data.difficulty = input.difficulty;
  return matter.stringify(`\n${input.content.trim()}\n`, data);
}

export function inputFromSource(path: string, source: string): ArticleDraftInput {
  const [, , category, fileName] = path.split("/");
  const slug = fileName.replace(/\.mdx$/, "");
  const post = parsePostSource(source, category as CategorySlug, slug);
  return postToDraftInput(post);
}

export async function validateMdxSource(source: string) {
  try {
    await compileMDX({ source, options: { blockJS: true, blockDangerousJS: true, mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug, [rehypePrettyCode, { theme: "github-dark-dimmed" }]] } } });
    return { valid: true, message: "Valid MDX" };
  } catch (error) {
    return { valid: false, message: error instanceof Error ? error.message : "The MDX content could not be compiled." };
  }
}

export async function validateDraft(input: ArticleDraftInput, existingPaths: string[] = []) {
  const errors: string[] = [];
  if (!input.title) errors.push("Title is required.");
  if (!input.slug || !slugPattern.test(input.slug)) errors.push("Slug must use lowercase letters, numbers, and single hyphens.");
  if (!categories.includes(input.category)) errors.push("Choose a valid category.");
  if (!input.description) errors.push("Description is required.");
  if (!tagsFromInput(input.tags).length) errors.push("Add at least one tag.");
  if (!input.content.trim()) errors.push("Article content is required.");
  if (!parseReadingTime(input.readingTime)) errors.push("Reading time must be a whole number of at least 1 minute.");
  if (input.invalidDifficulty || (input.difficulty && !normalizeDifficulty(input.difficulty))) errors.push("Difficulty must be Beginner, Intermediate, or Advanced.");
  if (input.status === "published" && !input.coverImage) errors.push("A cover image is required before publishing.");
  if (input.status === "published" && !input.coverAlt) errors.push("Cover image alt text is required before publishing.");
  const path = articlePath(input.category, input.slug);
  const existingPath = existingPaths.find((candidate) => candidate === path);
  if (existingPath) errors.push("Article already exists. Choose Edit existing article, change the slug, or cancel.");
  const mdx = await validateMdxSource(draftToSource(input));
  if (!mdx.valid) errors.push(`MDX validation failed: ${mdx.message}`);
  return { valid: errors.length === 0, errors, checks: { title: Boolean(input.title), slug: Boolean(input.slug && slugPattern.test(input.slug)), description: Boolean(input.description), category: categories.includes(input.category), tags: Boolean(tagsFromInput(input.tags).length), content: Boolean(input.content.trim()), cover: input.status === "draft" || Boolean(input.coverImage), altText: input.status === "draft" || Boolean(input.coverAlt), readingTime: Boolean(parseReadingTime(input.readingTime)), mdx: mdx.valid, canonical: Boolean(input.slug && slugPattern.test(input.slug)), openGraph: Boolean(input.title && input.description && (input.status === "draft" || input.coverImage)) } };
}

export async function getGithubArticles(): Promise<AuthorArticle[]> {
  const paths = await listGithubArticlePaths();
  const articles = await Promise.all(paths.map(async (path) => { const file = await getGithubFile(path); if (!file) return null; const [, , category] = path.split("/"); if (!categories.includes(category as CategorySlug)) return null; return { post: parsePostSource(file.content, category as CategorySlug, path.split("/").pop()!.replace(/\.mdx$/, "")), path, sha: file.sha, source: file.content }; }));
  return articles.filter((article): article is AuthorArticle => Boolean(article)).sort((a, b) => new Date(b.post.updatedAt || b.post.date).getTime() - new Date(a.post.updatedAt || a.post.date).getTime());
}

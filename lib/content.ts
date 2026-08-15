import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { categoryMeta, type CategorySlug } from "./site";

export type PostStatus = "draft" | "published";

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updatedAt?: string;
  category: CategorySlug;
  tags: string[];
  author: string;
  readingTime: string;
  coverImage: string;
  featured: boolean;
  status: PostStatus;
  seoTitle?: string;
  seoDescription?: string;
  content: string;
};

export type TocItem = { depth: 2 | 3; text: string; slug: string };

const contentRoot = path.join(process.cwd(), "content", "blog");
const categorySlugs = Object.keys(categoryMeta) as CategorySlug[];

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}

function readPost(filePath: string, category: CategorySlug): Post {
  const source = fs.readFileSync(filePath, "utf8");
  const parsed = matter(source);
  const data = parsed.data as Record<string, unknown>;
  const words = parsed.content.trim().split(/\s+/).filter(Boolean).length;
  const slug = path.basename(filePath, path.extname(filePath));

  return {
    slug,
    title: String(data.title || slug),
    description: String(data.description || ""),
    date: String(data.date || ""),
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
    category: (String(data.category || category) as CategorySlug),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    author: String(data.author || "Gulshan Kumar"),
    readingTime: String(data.readingTime || `${Math.max(1, Math.ceil(words / 200))} min read`),
    coverImage: String(data.coverImage || "/images/cover-editorial.svg"),
    featured: Boolean(data.featured),
    status: String(data.status || "published") as PostStatus,
    seoTitle: data.seoTitle ? String(data.seoTitle) : undefined,
    seoDescription: data.seoDescription ? String(data.seoDescription) : undefined,
    content: parsed.content,
  };
}

export function getAllPosts(options: { includeDrafts?: boolean } = {}) {
  const posts = categorySlugs.flatMap((category) => {
    const categoryDir = path.join(contentRoot, category);
    if (!fs.existsSync(categoryDir)) return [];
    return fs.readdirSync(categoryDir).filter((file) => file.endsWith(".mdx")).map((file) => readPost(path.join(categoryDir, file), category));
  });
  return posts.filter((post) => options.includeDrafts || post.status === "published").sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPost(slug: string) {
  return getAllPosts({ includeDrafts: true }).find((post) => post.slug === slug);
}

export function getPostsByCategory(category: CategorySlug) {
  return getAllPosts().filter((post) => post.category === category);
}

export function getFeaturedPosts() {
  return getAllPosts().filter((post) => post.featured).slice(0, 4);
}

export type RelatedRecommendation = {
  post: Post;
  score: number;
  reason: "Same topic" | "Shared tag" | "Fresh from the archive";
  sharedTags: string[];
};

export function getRelatedRecommendations(post: Post, limit = 3): RelatedRecommendation[] {
  return getAllPosts().filter((candidate) => candidate.slug !== post.slug).map((candidate) => {
    const sharedTags = candidate.tags.filter((tag) => post.tags.includes(tag));
    const sameCategory = candidate.category === post.category;
    const score = (sameCategory ? 8 : 0) + sharedTags.length * 3 + (candidate.featured ? 1 : 0);
    const reason: RelatedRecommendation["reason"] = sameCategory ? "Same topic" : sharedTags.length > 0 ? "Shared tag" : "Fresh from the archive";
    return { post: candidate, score, reason, sharedTags };
  }).sort((a, b) => b.score - a.score || new Date(b.post.date).getTime() - new Date(a.post.date).getTime()).slice(0, limit);
}

export function getRelatedPosts(post: Post, limit = 3) {
  return getRelatedRecommendations(post, limit).map(({ post: related }) => related);
}

export function getToc(content: string): TocItem[] {
  const usedSlugs = new Map<string, number>();
  let insideFence = false;

  return content.split("\n").flatMap((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      insideFence = !insideFence;
      return [];
    }
    if (insideFence) return [];

    const match = /^(##|###)\s+(.+?)\s*$/.exec(line);
    if (!match) return [];
    const text = match[2].replace(/[`*_]/g, "");
    const baseSlug = slugify(text) || "section";
    const occurrence = usedSlugs.get(baseSlug) || 0;
    usedSlugs.set(baseSlug, occurrence + 1);
    const slug = occurrence === 0 ? baseSlug : `${baseSlug}-${occurrence}`;
    return [{ depth: match[1].length as 2 | 3, text, slug }];
  });
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
}

export function getCategory(category: string) {
  return categoryMeta[category as CategorySlug];
}

export function getAllTags() {
  return Array.from(new Set(getAllPosts().flatMap((post) => post.tags))).sort();
}

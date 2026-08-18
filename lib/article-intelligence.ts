import type { ArticleDraftInput } from "@/lib/author-articles";
import type { Post } from "@/lib/content";
import { parseReadingTime } from "@/lib/article-metadata";

export type EditorialArticle = Pick<Post, "slug" | "title" | "description" | "date" | "updatedAt" | "category" | "tags" | "readingTime" | "difficulty" | "coverImage" | "coverAlt" | "featured" | "status" | "content">;
export type ArticleSource = EditorialArticle | ArticleDraftInput;
export type QualityState = "PASS" | "WARNING" | "NEEDS ATTENTION";
export type QualityCheck = { id: string; label: string; state: QualityState; detail?: string };
export type ArticleQuality = { checks: QualityCheck[]; score: number; passed: number; warnings: number; attention: number };
export type ContentStats = { words: number; headings: number; codeBlocks: number; images: number; internalLinks: number; estimatedReadingTime: number; descriptionCharacters: number; tagCount: number };
export type ArticleStatusLabel = "DRAFT" | "READY" | "PUBLISHED" | "FEATURED" | "RECENTLY UPDATED";

function text(value: unknown) { return String(value || "").trim(); }
function tagsFromArticle(article: ArticleSource) { const raw = Array.isArray(article.tags) ? article.tags : text(article.tags).split(/[,\n]/).map((tag) => tag.trim()).filter(Boolean); const seen = new Set<string>(); return raw.filter((tag) => { const key = tag.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; }); }
function contentFromArticle(article: ArticleSource) { return text(article.content); }
function titleTokens(value: string) { return new Set(text(value).toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((token) => token.length > 2)); }

export function countWords(content: string) { return text(content).split(/\s+/).filter(Boolean).length; }
export function countHeadings(content: string) { let fenced = false; return content.split("\n").filter((line) => { const trimmed = line.trim(); if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) { fenced = !fenced; return false; } return !fenced && /^#{2,4}\s+\S/.test(line); }).length; }
export function countCodeBlocks(content: string) { return (content.match(/(^|\n)\s*(```|~~~)/g) || []).length / 2; }
export function countImages(content: string) { return (content.match(/!\[[^\]]*\]\([^)]*\)|<img\b/gi) || []).length; }
export function countInternalLinks(content: string) { return (content.match(/(?:\]\(|href=["'])\/?blog\/[a-z0-9-]+/gi) || []).length; }
export function descriptionSignal(description: string) { const length = text(description).length; return { length, recommended: length >= 120 && length <= 160, state: length === 0 ? "NEEDS ATTENTION" as const : length >= 100 && length <= 180 ? "PASS" as const : "WARNING" as const }; }

export function getContentStats(article: ArticleSource): ContentStats {
  const content = contentFromArticle(article);
  const tags = tagsFromArticle(article);
  const words = countWords(content);
  return { words, headings: countHeadings(content), codeBlocks: countCodeBlocks(content), images: countImages(content), internalLinks: countInternalLinks(content), estimatedReadingTime: Math.max(1, Math.ceil(words / 200)), descriptionCharacters: text(article.description).length, tagCount: tags.length };
}

export function buildArticleQuality(article: ArticleSource, options: { mdxValid?: boolean; canonicalUrl?: string; now?: Date } = {}): ArticleQuality {
  const stats = getContentStats(article);
  const tags = tagsFromArticle(article);
  const content = contentFromArticle(article);
  const canonical = options.canonicalUrl || (text(article.slug) ? `https://gulshanblogs.vercel.app/blog/${text(article.slug)}` : "");
  const description = descriptionSignal(text(article.description));
  const checks: QualityCheck[] = [
    { id: "title", label: "Title exists", state: text(article.title) ? "PASS" : "NEEDS ATTENTION" },
    { id: "description", label: "Description exists", state: text(article.description) ? description.state : "NEEDS ATTENTION", detail: `${description.length} characters; recommended approximately 120–160.` },
    { id: "category", label: "Category exists", state: text(article.category) ? "PASS" : "NEEDS ATTENTION" },
    { id: "tags", label: "Tags exist", state: tags.length ? "PASS" : "NEEDS ATTENTION", detail: `${tags.length} tag${tags.length === 1 ? "" : "s"}.` },
    { id: "cover", label: "Cover image exists", state: text(article.coverImage) ? "PASS" : "NEEDS ATTENTION" },
    { id: "alt", label: "Cover alt text exists", state: text(article.coverAlt) ? "PASS" : "WARNING" },
    { id: "difficulty", label: "Difficulty exists", state: text(article.difficulty) ? "PASS" : "WARNING" },
    { id: "readingTime", label: "Reading time exists", state: parseReadingTime(article.readingTime) || article.readingTime ? "PASS" : "NEEDS ATTENTION" },
    { id: "content", label: "Article content exists", state: content ? "PASS" : "NEEDS ATTENTION", detail: `${stats.words} words.` },
    { id: "canonical", label: "Canonical URL", state: canonical ? "PASS" : "NEEDS ATTENTION" },
    { id: "openGraph", label: "Social preview available", state: text(article.title) && text(article.description) && text(article.coverImage) ? "PASS" : "WARNING" },
    { id: "mdx", label: "MDX compiles", state: options.mdxValid === true ? "PASS" : options.mdxValid === false ? "NEEDS ATTENTION" : "WARNING", detail: options.mdxValid === undefined ? "Run Validate to compile the current draft." : undefined },
    { id: "structure", label: "Content has meaningful sections", state: stats.headings >= 2 ? "PASS" : content ? "WARNING" : "NEEDS ATTENTION", detail: `${stats.headings} headings.` },
    { id: "code", label: "Code blocks remain usable", state: stats.codeBlocks ? "PASS" : "WARNING", detail: `${stats.codeBlocks} code block${stats.codeBlocks === 1 ? "" : "s"}.` },
    { id: "takeaways", label: "Key Takeaways included when appropriate", state: /key takeaways|key_takeaways/i.test(content) ? "PASS" : "WARNING" },
    { id: "links", label: "Internal article links", state: stats.internalLinks ? "PASS" : "WARNING", detail: stats.internalLinks ? `${stats.internalLinks} internal article link${stats.internalLinks === 1 ? "" : "s"}.` : "Recommendation: add a relevant internal article link." },
  ];
  const passed = checks.filter((check) => check.state === "PASS").length;
  const warnings = checks.filter((check) => check.state === "WARNING").length;
  const attention = checks.filter((check) => check.state === "NEEDS ATTENTION").length;
  const score = Math.round((passed / checks.length) * 100);
  return { checks, score, passed, warnings, attention };
}

export function getPublishingChecklist(article: ArticleSource, options: { mdxValid?: boolean; canonicalUrl?: string } = {}) {
  const quality = buildArticleQuality(article, options);
  const ids = new Set(quality.checks.filter((check) => check.state === "PASS").map((check) => check.id));
  return [
    { group: "CONTENT", items: [["Title", "title"], ["Description", "description"], ["Article body", "content"], ["Category", "category"], ["Tags", "tags"]] },
    { group: "MEDIA", items: [["Cover image", "cover"], ["Cover alt text", "alt"]] },
    { group: "METADATA", items: [["Reading time", "readingTime"], ["Difficulty", "difficulty"], ["Canonical URL", "canonical"]] },
    { group: "TECHNICAL", items: [["MDX content present", "content"], ["Social preview", "openGraph"], ["Safe cover path", "cover"]] },
    { group: "DISCOVERY", items: [["Related topics", "category"], ["RSS compatibility", "status"], ["Sitemap compatibility", "status"]] },
    { group: "SOCIAL", items: [["Open Graph", "openGraph"], ["Share Studio", "status"], ["Social preview", "openGraph"]] },
  ].map(({ group, items }) => ({ group, items: items.map(([label, id]) => ({ label, state: id === "status" ? (article.status === "published" ? "PASS" : "WARNING") : ids.has(id) ? "PASS" : quality.checks.find((check) => check.id === id)?.state || "WARNING" })) }));
}

export function getArticleStatuses(article: EditorialArticle, now = new Date()): ArticleStatusLabel[] {
  const statuses: ArticleStatusLabel[] = [article.status === "published" ? "PUBLISHED" : "DRAFT"];
  if (article.status === "published" && article.featured) statuses.push("FEATURED");
  const updated = new Date(article.updatedAt || article.date).getTime();
  if (Number.isFinite(updated) && now.getTime() - updated <= 1000 * 60 * 60 * 24 * 30) statuses.push("RECENTLY UPDATED");
  const quality = buildArticleQuality(article, { now });
  if (article.status === "draft" && quality.attention === 0) statuses.push("READY");
  return statuses;
}

export function getTitleSimilarity(title: string, otherTitles: string[], threshold = 0.6) {
  const source = titleTokens(title);
  if (!source.size) return null;
  let best: { title: string; score: number } | null = null;
  for (const candidate of otherTitles) {
    const target = titleTokens(candidate);
    if (!target.size) continue;
    const intersection = [...source].filter((token) => target.has(token)).length;
    const union = new Set([...source, ...target]).size;
    const score = union ? intersection / union : 0;
    if (score >= threshold && (!best || score > best.score)) best = { title: candidate, score };
  }
  return best;
}

export function getRelatedEditorialArticles(article: EditorialArticle, candidates: EditorialArticle[], limit = 3) {
  return candidates.filter((candidate) => candidate.slug !== article.slug && candidate.status === "published").map((candidate) => {
    const sharedTags = candidate.tags.filter((tag) => article.tags.some((other) => other.toLowerCase() === tag.toLowerCase()));
    const sameCategory = candidate.category === article.category;
    const score = (sameCategory ? 8 : 0) + sharedTags.length * 3 + (candidate.featured ? 1 : 0);
    return { article: candidate, score, reason: sameCategory ? "Same category" : sharedTags.length ? "Shared tag" : "Archive match", sharedTags };
  }).sort((a, b) => b.score - a.score || new Date(b.article.date).getTime() - new Date(a.article.date).getTime()).slice(0, limit);
}

export function getDashboardOverview(articles: EditorialArticle[], now = new Date()) {
  const recentlyUpdated = [...articles].sort((a, b) => new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime()).slice(0, 5);
  return { drafts: articles.filter((article) => article.status === "draft").length, published: articles.filter((article) => article.status === "published").length, total: articles.length, featured: articles.filter((article) => article.featured).length, recentlyUpdated, featuredArticles: articles.filter((article) => article.featured), nonFeaturedArticles: articles.filter((article) => !article.featured), timeline: [...articles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), generatedAt: now.toISOString() };
}

export function getInsightsState() { return { status: "not-configured" as const, message: "Analytics data is not connected yet. No traffic or search metrics are being invented." }; }

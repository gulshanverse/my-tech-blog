import type { EditorialArticle } from "@/lib/article-intelligence";
import { getContentStats } from "@/lib/article-intelligence";
import { categoryMeta, type CategorySlug } from "@/lib/site";

export type AnalyticsRangeKey = "7d" | "28d" | "3m" | "6m";
export type ProviderState = "connected" | "not-configured" | "error" | "available";
export type AnalyticsRange = { key: AnalyticsRangeKey; label: string; startDate: string; endDate: string };
export type SearchMetrics = { clicks: number; impressions: number; ctr: number; position: number | null };
export type SearchRow = SearchMetrics & { key: string; url?: string; query?: string; date?: string };
export type SearchConsoleData = {
  state: "connected" | "not-configured" | "error";
  reason?: "not_configured" | "provider_error" | "empty";
  metrics: SearchMetrics | null;
  trend: SearchRow[];
  queries: SearchRow[];
  pages: SearchRow[];
};

const rangeDays: Record<AnalyticsRangeKey, number> = { "7d": 7, "28d": 28, "3m": 90, "6m": 180 };
const rangeLabels: Record<AnalyticsRangeKey, string> = { "7d": "7 days", "28d": "28 days", "3m": "3 months", "6m": "6 months" };

function dateOnly(date: Date) { return date.toISOString().slice(0, 10); }
function finiteNumber(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : 0; }

export function isAnalyticsRange(value: string): value is AnalyticsRangeKey { return value === "7d" || value === "28d" || value === "3m" || value === "6m"; }

export function getAnalyticsRange(key: AnalyticsRangeKey, now = new Date()): AnalyticsRange {
  const end = new Date(now);
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - (rangeDays[key] - 1));
  return { key, label: rangeLabels[key], startDate: dateOnly(start), endDate: dateOnly(end) };
}

export function normalizeSearchRows(rows: unknown, dimension: "date" | "query" | "page"): SearchRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row: unknown) => {
    if (!row || typeof row !== "object") return [];
    const candidate = row as { keys?: unknown; clicks?: unknown; impressions?: unknown; ctr?: unknown; position?: unknown };
    const key = Array.isArray(candidate.keys) && typeof candidate.keys[0] === "string" ? candidate.keys[0] : "";
    if (!key) return [];
    const clicks = finiteNumber(candidate.clicks);
    const impressions = finiteNumber(candidate.impressions);
    return [{ key, [dimension === "date" ? "date" : dimension === "query" ? "query" : "url"]: key, clicks, impressions, ctr: finiteNumber(candidate.ctr), position: typeof candidate.position === "number" && Number.isFinite(candidate.position) ? candidate.position : null } as SearchRow];
  });
}

export function aggregateSearchRows(rows: SearchRow[]): SearchMetrics | null {
  if (!rows.length) return null;
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const weightedPosition = rows.reduce((sum, row) => sum + (row.position === null ? 0 : row.position * Math.max(row.impressions, 1)), 0);
  const positionWeight = rows.reduce((sum, row) => sum + (row.position === null ? 0 : Math.max(row.impressions, 1)), 0);
  return { clicks, impressions, ctr: impressions > 0 ? clicks / impressions : 0, position: positionWeight > 0 ? weightedPosition / positionWeight : null };
}

export function normalizeSearchConsoleResponse(responses: { trend?: unknown; queries?: unknown; pages?: unknown }): SearchConsoleData {
  const trend = normalizeSearchRows(responses.trend, "date");
  const queries = normalizeSearchRows(responses.queries, "query");
  const pages = normalizeSearchRows(responses.pages, "page");
  const metrics = aggregateSearchRows(trend.length ? trend : queries);
  return { state: metrics || queries.length || pages.length ? "connected" : "connected", reason: metrics || queries.length || pages.length ? undefined : "empty", metrics, trend, queries, pages };
}

export type EditorialAnalytics = {
  total: number;
  published: number;
  drafts: number;
  featured: number;
  averageWords: number | null;
  averageReadingTime: number | null;
  withCode: number;
  withTakeaways: number;
  withInternalLinks: number;
  withCoverImages: number;
  metadataComplete: number;
  byCategory: Array<{ slug: CategorySlug; name: string; articles: number; published: number; drafts: number }>;
  byTag: Array<{ tag: string; articles: number }>;
  publishedByMonth: Array<{ month: string; articles: number }>;
  recentlyUpdated: EditorialArticle[];
  topArticles: EditorialArticle[];
};

export function buildEditorialAnalytics(articles: EditorialArticle[], now = new Date()): EditorialAnalytics {
  const stats = articles.map((article) => ({ article, stats: getContentStats(article) }));
  const words = stats.map(({ stats }) => stats.words).filter((value) => value > 0);
  const readingTimes = articles.map((article) => Number(article.readingTime)).filter((value) => Number.isFinite(value) && value > 0);
  const categoryRows = (Object.values(categoryMeta) as Array<{ slug: CategorySlug; name: string }>).map((category) => {
    const matching = articles.filter((article) => article.category === category.slug);
    return { slug: category.slug, name: category.name, articles: matching.length, published: matching.filter((article) => article.status === "published").length, drafts: matching.filter((article) => article.status === "draft").length };
  });
  const tagCounts = new Map<string, { tag: string; articles: number }>();
  articles.forEach((article) => {
    const seen = new Set<string>();
    article.tags.forEach((tag) => { const normalized = tag.trim().toLowerCase(); if (!normalized || seen.has(normalized)) return; seen.add(normalized); const row = tagCounts.get(normalized); tagCounts.set(normalized, { tag: row?.tag || tag.trim(), articles: (row?.articles || 0) + 1 }); });
  });
  const monthCounts = new Map<string, number>();
  articles.filter((article) => article.status === "published").forEach((article) => { const month = article.date.slice(0, 7); monthCounts.set(month, (monthCounts.get(month) || 0) + 1); });
  const recentlyUpdated = [...articles].sort((a, b) => new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime()).slice(0, 8);
  return {
    total: articles.length,
    published: articles.filter((article) => article.status === "published").length,
    drafts: articles.filter((article) => article.status === "draft").length,
    featured: articles.filter((article) => article.featured).length,
    averageWords: words.length ? Math.round(words.reduce((sum, value) => sum + value, 0) / words.length) : null,
    averageReadingTime: readingTimes.length ? Math.round((readingTimes.reduce((sum, value) => sum + value, 0) / readingTimes.length) * 10) / 10 : null,
    withCode: stats.filter(({ stats }) => stats.codeBlocks > 0).length,
    withTakeaways: articles.filter((article) => /key takeaways|key_takeaways/i.test(article.content)).length,
    withInternalLinks: stats.filter(({ stats }) => stats.internalLinks > 0).length,
    withCoverImages: articles.filter((article) => Boolean(article.coverImage)).length,
    metadataComplete: articles.filter((article) => Boolean(article.title && article.description && article.category && article.tags.length && article.coverImage && article.coverAlt && article.readingTime)).length,
    byCategory: categoryRows,
    byTag: Array.from(tagCounts.values()).sort((a, b) => b.articles - a.articles || a.tag.localeCompare(b.tag)),
    publishedByMonth: Array.from(monthCounts.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, articles: count })),
    recentlyUpdated,
    topArticles: [...articles].sort((a, b) => new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime()).slice(0, 5),
  };
}

export function formatMetric(value: number | null, suffix = "") { return value === null ? "Not available" : `${value}${suffix}`; }

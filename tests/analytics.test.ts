import { describe, expect, it } from "vitest";
import { aggregateSearchRows, buildEditorialAnalytics, getAnalyticsRange, normalizeSearchConsoleResponse } from "@/lib/analytics";

const article = { slug: "rag-systems", title: "RAG Systems", description: "A useful description", date: "2026-08-01", updatedAt: "2026-08-10", category: "ai" as const, tags: ["RAG", "AI"], readingTime: 8, difficulty: "Intermediate" as const, coverImage: "/images/rag.svg", coverAlt: "RAG diagram", featured: true, status: "published" as const, content: "## Context\n\nKey Takeaways\n\n```ts\nconst answer = true\n```\n\n[More](/blog/other-article)" };

describe("Analytics data contracts", () => {
  it("builds deterministic inclusive date ranges", () => {
    expect(getAnalyticsRange("28d", new Date("2026-08-18T12:00:00Z"))).toMatchObject({ key: "28d", startDate: "2026-07-22", endDate: "2026-08-18" });
  });

  it("normalizes real Search Console rows without replacing missing values with fake data", () => {
    const data = normalizeSearchConsoleResponse({ trend: [{ keys: ["2026-08-17"], clicks: 4, impressions: 20, ctr: 0.2, position: 3.5 }], queries: [{ keys: ["rag systems"], clicks: 4, impressions: 20, ctr: 0.2, position: 3.5 }], pages: [] });
    expect(data.state).toBe("connected");
    expect(data.metrics).toMatchObject({ clicks: 4, impressions: 20, ctr: 0.2, position: 3.5 });
    expect(data.queries[0].query).toBe("rag systems");
    expect(data.pages).toEqual([]);
  });

  it("distinguishes empty provider data from unavailable provider data", () => {
    const empty = normalizeSearchConsoleResponse({ trend: [], queries: [], pages: [] });
    expect(empty.state).toBe("connected");
    expect(empty.reason).toBe("empty");
    expect(empty.metrics).toBeNull();
  });

  it("aggregates metrics with an impression-weighted position", () => {
    expect(aggregateSearchRows([{ key: "a", clicks: 2, impressions: 10, ctr: 0.2, position: 2 }, { key: "b", clicks: 1, impressions: 20, ctr: 0.05, position: 5 }])).toMatchObject({ clicks: 3, impressions: 30, ctr: 0.1, position: 4 });
  });

  it("builds editorial repository metrics without calling them traffic", () => {
    const metrics = buildEditorialAnalytics([article]);
    expect(metrics).toMatchObject({ total: 1, published: 1, drafts: 0, featured: 1, withCode: 1, withTakeaways: 1, withInternalLinks: 1, withCoverImages: 1, metadataComplete: 1, averageWords: 11, averageReadingTime: 8 });
    expect(metrics.byCategory.find((row) => row.slug === "ai")).toMatchObject({ articles: 1, published: 1 });
    expect(metrics.byTag.find((row) => row.tag === "RAG")).toMatchObject({ articles: 1 });
  });
});

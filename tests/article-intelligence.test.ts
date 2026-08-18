import { describe, expect, it } from "vitest";
import { buildArticleQuality, countCodeBlocks, countHeadings, countImages, countInternalLinks, countWords, descriptionSignal, getArticleStatuses, getDashboardOverview, getInsightsState, getPublishingChecklist, getRelatedEditorialArticles, getTitleSimilarity, getContentStats } from "@/lib/article-intelligence";

const base = { slug: "agentic-ai", title: "Agentic AI Systems", description: "A practical guide to designing reliable technical agents with tools, memory, planning, orchestration, and production safeguards for engineering teams.", date: "2026-08-18", updatedAt: "2026-08-18", category: "ai" as const, tags: ["AI", "Agents"], readingTime: 8, difficulty: "Intermediate" as const, coverImage: "/images/agentic.png", coverAlt: "Technical illustration of an AI agent", featured: true, status: "published" as const, content: "## Overview\n\nA paragraph with [another article](/blog/rag-systems).\n\n### Code\n\n```ts\nconst agent = true;\n```\n\n![Diagram](/images/diagram.png)" };

describe("article intelligence", () => {
  it("counts words, headings, code blocks, images, and internal article links deterministically", () => {
    expect(countWords(base.content)).toBeGreaterThan(10);
    expect(countHeadings(base.content)).toBe(2);
    expect(countCodeBlocks(base.content)).toBe(1);
    expect(countImages(base.content)).toBe(1);
    expect(countInternalLinks(base.content)).toBe(1);
  });

  it("signals the recommended description range without forcing it", () => {
    expect(descriptionSignal(base.description).state).toBe("PASS");
    expect(descriptionSignal("short").state).toBe("WARNING");
    expect(descriptionSignal("").state).toBe("NEEDS ATTENTION");
  });

  it("builds honest quality and publishing checklist states", () => {
    const quality = buildArticleQuality(base);
    expect(quality.attention).toBe(0);
    expect(quality.checks.find((check) => check.id === "mdx")?.state).toBe("WARNING");
    const checklist = getPublishingChecklist(base);
    expect(checklist.find((group) => group.group === "CONTENT")?.items.find((item) => item.label === "Title")?.state).toBe("PASS");
  });

  it("calculates editor metrics from draft-shaped input", () => {
    const stats = getContentStats({ ...base, tags: "AI, AI, Agents", readingTime: "8", difficulty: "Intermediate" as const, coverAlt: base.coverAlt });
    expect(stats.tagCount).toBe(2);
    expect(stats.estimatedReadingTime).toBeGreaterThan(0);
  });

  it("detects similar titles only as a warning", () => {
    expect(getTitleSimilarity("Understanding RAG Systems", ["Understanding RAG Systems: An Overview"])).toMatchObject({ title: expect.stringContaining("Understanding RAG") });
    expect(getTitleSimilarity("A Completely Different Topic", ["Understanding RAG Systems"])).toBeNull();
  });

  it("sorts real articles into dashboard overview and related content", () => {
    const draft = { ...base, slug: "draft", title: "Draft", status: "draft" as const, featured: false, date: "2026-08-17" };
    const overview = getDashboardOverview([draft, base]);
    expect(overview).toMatchObject({ drafts: 1, published: 1, total: 2, featured: 1 });
    expect(getRelatedEditorialArticles(base, [{ ...base, slug: "related", title: "Related", tags: ["Agents"], featured: false }])).toHaveLength(1);
  });

  it("derives transparent article statuses and no-data insights state", () => {
    expect(getArticleStatuses(base, new Date("2026-08-19"))).toEqual(["PUBLISHED", "FEATURED", "RECENTLY UPDATED"]);
    expect(getInsightsState()).toMatchObject({ status: "not-configured" });
  });
});

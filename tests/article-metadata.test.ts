import { describe, expect, it } from "vitest";
import { ARTICLE_COVER_HEIGHT, ARTICLE_COVER_RATIO_LABEL, ARTICLE_COVER_WIDTH, coverRatioLabel, formatReadingTime, isRecommendedCoverRatio, normalizeDifficulty, parseReadingTime } from "@/lib/article-metadata";
import { normalizeDraftInput, validateDraft } from "@/lib/author-articles";

describe("article metadata", () => {
  it.each([["6 min read", 6], ["6 min", 6], ["6", 6], [6, 6]])("parses legacy reading time %s", (value, expected) => {
    expect(parseReadingTime(value)).toBe(expected);
    expect(formatReadingTime(value)).toBe("6 min read");
  });

  it.each(["", "abc", "-2", "2.5", "0", "6 minutes reading"]) ("rejects invalid reading time %s", (value) => {
    expect(parseReadingTime(value)).toBeUndefined();
    expect(formatReadingTime(value)).toBe("");
  });

  it("formats and keeps the minimum reading time at one minute", () => {
    expect(parseReadingTime("1")).toBe(1);
    expect(parseReadingTime("0")).toBeUndefined();
    expect(formatReadingTime(1)).toBe("1 min read");
  });

  it.each([["Beginner", "Beginner"], ["Intermediate", "Intermediate"], ["Advanced", "Advanced"], ["Medium", "Intermediate"]]) ("normalizes supported difficulty %s", (value, expected) => {
    expect(normalizeDifficulty(value)).toBe(expected);
  });

  it("rejects unsupported difficulty values", async () => {
    expect(normalizeDifficulty("Expert")).toBeUndefined();
    expect(normalizeDifficulty("")).toBeUndefined();
    const result = await validateDraft(normalizeDraftInput({ title: "Title", slug: "title", description: "Description", tags: "tag", content: "Content", difficulty: "Expert" as never }));
    expect(result.errors).toContain("Difficulty must be Beginner, Intermediate, or Advanced.");
  });

  it("defines and checks the canonical 16:9 cover specification", () => {
    expect(`${ARTICLE_COVER_WIDTH} × ${ARTICLE_COVER_HEIGHT} px`).toBe("2400 × 1350 px");
    expect(ARTICLE_COVER_RATIO_LABEL).toBe("16:9");
    expect(isRecommendedCoverRatio(2400, 1350)).toBe(true);
    expect(isRecommendedCoverRatio(1536, 1024)).toBe(false);
    expect(coverRatioLabel(1672, 941)).toBe("1.78:1");
  });
});

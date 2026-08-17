import { afterEach, describe, expect, it, vi } from "vitest";
import { AUTO_SAVE_DELAY_MS, canAutoSaveDraft, scheduleAutoSave } from "@/lib/author-autosave";

const jsonResponse = (body: unknown, ok = true) => ({ ok, json: async () => body });

describe("Author Studio article helpers", () => {
  it("normalizes tags case-insensitively while preserving the first label", async () => {
    vi.resetModules();
    const { tagsFromInput } = await import("@/lib/author-articles");
    expect(tagsFromInput("RAG, rag, Rag, LLM, LLM")).toEqual(["RAG", "LLM"]);
  });

  it("generates safe category and slug paths", async () => {
    const { articlePath } = await import("@/lib/author-articles");
    expect(articlePath("ai", "understanding-rag")).toBe("content/blog/ai/understanding-rag.mdx");
  });

  it("keeps published metadata in serialized frontmatter and validates MDX", async () => {
    const { draftToSource, validateDraft } = await import("@/lib/author-articles");
    const input = { title: "A Published Test", slug: "a-published-test", category: "ai" as const, tags: "RAG", description: "Description", coverImage: "/cover.svg", coverAlt: "Cover", readingTime: "5 min read", difficulty: "Intermediate", status: "published" as const, content: "## Heading\n\nContent.", date: "2026-08-18", updatedAt: "", featured: false };
    const source = draftToSource(input);
    expect(source).toContain("status: published");
    expect(source).toContain("author: Gulshan Kumar");
    const result = await validateDraft(input);
    expect(result.valid).toBe(true);
    expect(result.checks.mdx).toBe(true);
  });

  it("rejects incomplete drafts without losing the input model", async () => {
    const { emptyDraftInput, validateDraft } = await import("@/lib/author-articles");
    const input = emptyDraftInput();
    const result = await validateDraft(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining(["Title is required.", "Article content is required."]));
    expect(input.status).toBe("draft");
  });
});

describe("Draft autosave behavior", () => {
  it("waits for the debounce window and runs once after repeated scheduling", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const scheduler = scheduleAutoSave(callback);
    scheduler.schedule(); scheduler.schedule();
    vi.advanceTimersByTime(AUTO_SAVE_DELAY_MS - 1);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("only marks complete drafts eligible for remote autosave", async () => {
    const { emptyDraftInput } = await import("@/lib/author-articles");
    const draft = { ...emptyDraftInput(), title: "Title", slug: "title", description: "Description", tags: "RAG", readingTime: "4 min read", content: "Content" };
    expect(canAutoSaveDraft(draft)).toBe(true);
    expect(canAutoSaveDraft({ ...draft, status: "published" })).toBe(false);
    expect(canAutoSaveDraft({ ...draft, content: "" })).toBe(false);
  });

  it("cancels a pending autosave safely", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const scheduler = scheduleAutoSave(callback);
    scheduler.schedule(); scheduler.cancel();
    vi.advanceTimersByTime(AUTO_SAVE_DELAY_MS);
    expect(callback).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe("GitHub persistence and revision helpers", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses the configured repository, branch, article path, and SHA", async () => {
    process.env.GITHUB_REPOSITORY = "test-owner/test-repo";
    process.env.GITHUB_BRANCH = "author-test-branch";
    process.env.GITHUB_TOKEN = "server-only-token";
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ content: Buffer.from("---\ntitle: Test\n---\n\nContent").toString("base64"), sha: "file-sha" }));
    vi.stubGlobal("fetch", fetchMock);
    const github = await import("@/lib/github-content");
    await github.getGithubFile("content/blog/ai/test-article.mdx");
    await github.writeGithubFile("content/blog/ai/test-article.mdx", "content", "draft: save", "file-sha");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain("/repos/test-owner/test-repo/contents/content/blog/ai/test-article.mdx?ref=author-test-branch");
    const writeRequest = fetchMock.mock.calls[1][1] as RequestInit;
    expect(JSON.parse(String(writeRequest.body))).toMatchObject({ branch: "author-test-branch", sha: "file-sha", message: "draft: save" });
    expect(String((writeRequest.headers as Record<string, string>).Authorization)).toContain("Bearer server-only-token");
  });

  it("surfaces stale SHA conflicts instead of silently overwriting", async () => {
    process.env.GITHUB_TOKEN = "server-only-token";
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "SHA does not match" }, false)));
    const { writeGithubFile } = await import("@/lib/github-content");
    await expect(writeGithubFile("content/blog/ai/test.mdx", "content", "save", "stale-sha")).rejects.toThrow("SHA does not match");
  });

  it("parses revision commit metadata and bounds the history request", async () => {
    process.env.GITHUB_TOKEN = "server-only-token";
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ sha: "abcdef1234567", commit: { message: "draft: save\nmore", author: { name: "Gulshan Kumar", date: "2026-08-18T10:00:00Z" } }, author: { login: "gulshanverse" } }]));
    vi.stubGlobal("fetch", fetchMock);
    const { getGithubRevisions } = await import("@/lib/github-content");
    await expect(getGithubRevisions("content/blog/ai/test.mdx", 100)).resolves.toEqual([{ sha: "abcdef1234567", message: "draft: save", author: "gulshanverse", timestamp: "2026-08-18T10:00:00Z" }]);
    expect(fetchMock.mock.calls[0][0]).toContain("per_page=50");
  });
});

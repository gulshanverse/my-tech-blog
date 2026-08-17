import { describe, expect, it, vi } from "vitest";

const publishedSource = `---
title: Published article
description: A test article
date: 2026-08-18
category: ai
tags:
  - RAG
author: Gulshan Kumar
readingTime: 4 min read
coverImage: /cover.svg
coverAlt: Test cover
status: published
---

## Content

Published content.
`;

vi.mock("@/lib/author-auth", () => ({ hasAuthorSession: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/github-content", () => ({
  githubContentConfigured: () => true,
  getGithubFile: vi.fn().mockResolvedValue({ path: "content/blog/ai/published-article.mdx", sha: "current-sha", content: publishedSource }),
  getGithubRevisionFile: vi.fn().mockResolvedValue({ path: "content/blog/ai/published-article.mdx", sha: "revision-sha", content: publishedSource }),
  getGithubRevisions: vi.fn().mockResolvedValue([]),
  writeGithubFile: vi.fn(),
  deleteGithubFile: vi.fn(),
}));

describe("Author Studio mutation guards", async () => {
  const { GET, POST } = await import("@/app/api/author/articles/route");

  it("rejects invalid revision identifiers before reading revision content", async () => {
    const response = await GET(new Request("http://localhost/api/author/articles?path=content%2Fblog%2Fai%2Fpublished-article.mdx&revision=not-a-sha"));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "Invalid revision identifier." });
  });

  it("requires explicit confirmation before restoring a published article", async () => {
    const response = await POST(new Request("http://localhost/api/author/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "restore", path: "content/blog/ai/published-article.mdx", revisionSha: "abcdef1234567" }) }));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ requiresConfirmation: true });
  });
});

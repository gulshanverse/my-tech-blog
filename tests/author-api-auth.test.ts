import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/author-auth", () => ({ hasAuthorSession: vi.fn().mockResolvedValue(false) }));

describe("Author Studio authorization", async () => {
  const { GET, POST, PUT, DELETE } = await import("@/app/api/author/articles/route");

  it.each(["GET", "POST", "PUT", "DELETE"])("rejects unauthenticated %s article requests", async (method) => {
    const request = new Request("http://localhost/api/author/articles", { method, headers: { "Content-Type": "application/json" }, body: method === "GET" ? undefined : JSON.stringify({ action: "restore", path: "content/blog/ai/test.mdx", revisionSha: "abcdef1234567" }) });
    const response = method === "GET" ? await GET(request) : method === "POST" ? await POST(request) : method === "PUT" ? await PUT(request) : await DELETE(request);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: "Author Studio access is required." });
  });
});

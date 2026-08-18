import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/author-auth", () => ({ hasAuthorSession: vi.fn().mockResolvedValue(false) }));

describe("Author Analytics API authorization", async () => {
  const { GET } = await import("@/app/api/author/analytics/route");

  it("rejects unauthenticated requests", async () => {
    const response = await GET(new Request("http://localhost/api/author/analytics?range=28d"));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: "Author Studio access is required." });
  });
});

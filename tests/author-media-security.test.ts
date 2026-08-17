import { describe, expect, it, vi } from "vitest";

const writeGithubBase64File = vi.fn();
vi.mock("@/lib/author-auth", () => ({ hasAuthorSession: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/github-content", () => ({
  githubContentConfigured: () => true,
  getGithubFile: vi.fn().mockResolvedValue(null),
  writeGithubBase64File,
}));

describe("Author media upload security", async () => {
  const { POST } = await import("@/app/api/author/media/route");

  it("rejects path traversal filenames and does not write to GitHub", async () => {
    const bytes = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
    const response = await POST(new Request("http://localhost/api/author/media", { method: "POST", body: JSON.stringify({ slug: "safe-article", fileName: "../unrelated.jpg", mimeType: "image/jpeg", size: bytes.length, contentBase64: bytes.toString("base64") }), headers: { "Content-Type": "application/json" } }));
    expect(response.status).toBe(400);
    expect(writeGithubBase64File).not.toHaveBeenCalled();
  });

  it("rejects unsafe SVG payloads and oversized uploads", async () => {
    const unsafeSvg = Buffer.from('<svg><script>alert(1)</script></svg>');
    const svgResponse = await POST(new Request("http://localhost/api/author/media", { method: "POST", body: JSON.stringify({ slug: "safe-article", fileName: "cover.svg", mimeType: "image/svg+xml", size: unsafeSvg.length, contentBase64: unsafeSvg.toString("base64") }), headers: { "Content-Type": "application/json" } }));
    expect(svgResponse.status).toBe(400);

    const oversized = Buffer.alloc(5 * 1024 * 1024 + 1);
    const sizeResponse = await POST(new Request("http://localhost/api/author/media", { method: "POST", body: JSON.stringify({ slug: "safe-article", fileName: "cover.jpg", mimeType: "image/jpeg", size: oversized.length, contentBase64: oversized.toString("base64") }), headers: { "Content-Type": "application/json" } }));
    expect(sizeResponse.status).toBe(400);
    expect(writeGithubBase64File).not.toHaveBeenCalled();
  });
});

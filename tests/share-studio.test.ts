import { describe, expect, it } from "vitest";
import { extractHeadings, generateShareContent, type SharePlatform } from "@/lib/share-content";
import { buildShareUrl } from "@/lib/share-urls";

const article = {
  title: "Agents & Context: “A practical guide” 🚀",
  slug: "agents-context-guide",
  description: "A practical guide to agents, tools, memory, and reliable context.",
  category: "ai",
  tags: ["Agentic AI", "LLM", "RAG"],
  coverImage: "/images/articles/agents-context-guide.png",
  content: "# Architecture\n\n## Tool use\n\n<KeyTakeaways>\n- Agents choose tools.\n- Context improves grounded answers.\n</KeyTakeaways>",
};

const platforms: SharePlatform[] = ["x", "linkedin", "whatsapp", "telegram", "facebook", "reddit", "email"];

describe("deterministic Share Studio content", () => {
  it("generates distinct, article-grounded content for every platform", () => {
    const posts = platforms.map((platform) => generateShareContent(article, platform));
    expect(new Set(posts.map((post) => post.text)).size).toBe(platforms.length);
    for (const post of posts) {
      if (post.platform === "reddit") expect(post.title).toContain(article.title);
      else expect(post.text).toContain(article.title);
      expect(post.text).toContain("https://gulshanblogs.vercel.app/blog/agents-context-guide");
      expect(post.text).not.toContain("made-up");
    }
    expect(posts.find((post) => post.platform === "linkedin")?.text).toContain("latest technical article");
    expect(posts.find((post) => post.platform === "reddit")?.title).toContain("I wrote");
    expect(posts.find((post) => post.platform === "email")?.subject).toContain(article.title);
  });

  it("uses takeaways before headings when description is missing", () => {
    const post = generateShareContent({ ...article, description: "", tags: [] }, "whatsapp");
    expect(post.text).toContain("Agents choose tools.");
    expect(post.text).not.toContain("Architecture, Tool use");
  });

  it("falls back to headings and then a simple category summary", () => {
    const withHeadings = generateShareContent({ ...article, description: "", content: "# First heading\n\n## Second heading" }, "facebook");
    expect(withHeadings.text).toContain("First heading, Second heading");
    const withoutContent = generateShareContent({ ...article, description: "", content: "", category: "research" }, "facebook");
    expect(withoutContent.text).toContain("research");
    expect(extractHeadings(article.content)).toEqual(["Architecture", "Tool use"]);
  });

  it("keeps hashtags bounded and derives them from the article tags", () => {
    const post = generateShareContent(article, "x");
    expect(post.hashtags).toEqual(["#AgenticAI", "#LLM", "#RAG"]);
    expect(post.text.match(/#[A-Za-z0-9]+/g)).toHaveLength(3);
  });

  it("builds correctly encoded destination URLs for all supported share actions", () => {
    const generated = generateShareContent(article, "x");
    for (const platform of platforms) {
      const post = generateShareContent(article, platform);
      const url = buildShareUrl(platform, post.articleUrl, post.text, post.title || post.subject || article.title);
      expect(url).toContain(encodeURIComponent(post.articleUrl));
      expect(url).not.toContain(" ");
    }
    expect(buildShareUrl("x", generated.articleUrl, generated.text)).toContain("twitter.com/intent/tweet");
    expect(buildShareUrl("email", generated.articleUrl, generated.text, "A & B")).toContain("subject=A%20%26%20B");
  });

  it("preserves Unicode and long titles without inventing metadata", () => {
    const longTitle = "非常に長い技術記事のタイトル — ".repeat(12);
    const post = generateShareContent({ ...article, title: longTitle, description: "" }, "x");
    expect(post.text).toContain(longTitle);
    expect(post.articleUrl).toBe("https://gulshanblogs.vercel.app/blog/agents-context-guide");
    expect(post.text).not.toContain("statistics");
  });
});

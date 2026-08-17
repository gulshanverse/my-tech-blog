import { siteConfig } from "@/lib/site";

export type SharePlatform = "x" | "linkedin" | "whatsapp" | "telegram" | "facebook" | "reddit" | "email";

export type ShareArticle = {
  title: string;
  slug: string;
  description?: string;
  category?: string;
  tags?: string[];
  readingTime?: string;
  difficulty?: string;
  coverImage?: string;
  authorName?: string;
  content?: string;
};

export type ShareContent = {
  platform: SharePlatform;
  text: string;
  title?: string;
  subject?: string;
  articleUrl: string;
  hashtags: string[];
};

export interface ShareContentGenerator {
  generate(article: ShareArticle, platform: SharePlatform): ShareContent;
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function extractTakeaways(content = "") {
  const block = content.match(/<KeyTakeaways[^>]*>([\s\S]*?)<\/KeyTakeaways>/i)?.[1] || "";
  return block.split("\n").map((line) => cleanText(line.replace(/^\s*[-*]\s+/, "").replace(/^\s*\d+[.)]\s+/, ""))).filter((line) => line && !line.startsWith("<") && !line.endsWith(">"));
}

function extractHeadings(content = "") {
  return content.split("\n").filter((line) => /^#{1,6}\s/.test(line)).map((line) => cleanText(line.replace(/^#{1,6}\s+/, ""))).filter((line) => line && !line.startsWith("<") && !line.startsWith("![") && !line.startsWith("[") && line.length < 120);
}

function hashtags(tags: string[] = []) {
  return tags.map((tag) => `#${tag.replace(/[^a-zA-Z0-9]/g, "")}`).filter((tag) => tag.length > 1).slice(0, 4);
}

function articleSummary(article: ShareArticle) {
  const description = cleanText(article.description || "");
  if (description) return description;
  const takeaways = extractTakeaways(article.content).slice(0, 2);
  if (takeaways.length) return takeaways.join(" ");
  const headings = extractHeadings(article.content).slice(0, 3);
  return headings.length ? `A practical guide covering ${headings.join(", ")}.` : `A practical article about ${article.category || "technology"}.`;
}

function articleUrl(article: ShareArticle) {
  return `${siteConfig.url}/blog/${encodeURIComponent(article.slug)}`;
}

export class DeterministicShareContentGenerator implements ShareContentGenerator {
  generate(article: ShareArticle, platform: SharePlatform): ShareContent {
    const url = articleUrl(article);
    const summary = articleSummary(article);
    const tags = hashtags(article.tags);
    const tagText = tags.join(" ");
    const contentByPlatform: Record<SharePlatform, Omit<ShareContent, "platform" | "articleUrl" | "hashtags">> = {
      x: { text: `${article.title}\n\n${summary}\n\n${url}${tagText ? `\n\n${tagText}` : ""}` },
      linkedin: { text: `${article.title}\n\nIn my latest technical article, I explore ${summary.toLowerCase()}\n\nRead the full article:\n${url}${tagText ? `\n\n${tagText}` : ""}` },
      whatsapp: { text: `New article:\n\n“${article.title}”\n\n${summary}\n\nRead it here:\n${url}` },
      telegram: { text: `📚 New article\n\n${article.title}\n\n${summary}\n\nRead the article:\n${url}` },
      facebook: { text: `${article.title}\n\n${summary}\n\nRead:\n${url}` },
      reddit: { title: `I wrote a practical breakdown of ${article.title}`, text: `I've been exploring this topic and wanted to document the ideas in a practical way.\n\n${summary}\n\nI'd be interested in feedback on the approach.\n\n${url}` },
      email: { subject: `New article: ${article.title}`, text: `Hi,\n\nI just published a new technical article:\n\n${article.title}\n\n${summary}\n\nRead it here:\n${url}\n\n— Gulshan` },
    };
    return { platform, articleUrl: url, hashtags: tags, ...contentByPlatform[platform] };
  }
}

export const deterministicShareContentGenerator = new DeterministicShareContentGenerator();
export function generateShareContent(article: ShareArticle, platform: SharePlatform) { return deterministicShareContentGenerator.generate(article, platform); }
export { extractHeadings, extractTakeaways, articleSummary };

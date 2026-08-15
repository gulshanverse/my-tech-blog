import { getAllPosts, getCategory } from "@/lib/content";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" })[character] || character);
}

function toRssDate(value: string) {
  return new Date(value).toUTCString();
}

export function GET() {
  const posts = getAllPosts();
  const latestDate = posts.reduce((latest, post) => {
    const candidateDate = new Date(post.updatedAt || post.date).getTime();
    return candidateDate > latest ? candidateDate : latest;
  }, 0);
  const feedUrl = `${siteConfig.url}/feed.xml`;
  const items = posts.map((post) => {
    const postUrl = `${siteConfig.url}/blog/${post.slug}`;
    const category = getCategory(post.category);
    return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(postUrl)}</link>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${toRssDate(post.date)}</pubDate>
      <category>${escapeXml(category?.name || post.category)}</category>
      ${post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("\n      ")}
    </item>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteConfig.name)} — ${escapeXml(siteConfig.tagline)}</title>
    <link>${escapeXml(siteConfig.url)}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>en</language>
    <lastBuildDate>${toRssDate(latestDate ? new Date(latestDate).toISOString() : new Date().toISOString())}</lastBuildDate>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}

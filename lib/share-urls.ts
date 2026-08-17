import type { SharePlatform } from "@/lib/share-content";

export function buildShareUrl(platform: SharePlatform, articleUrl: string, text: string, title = "") {
  const encodedUrl = encodeURIComponent(articleUrl);
  const encodedText = encodeURIComponent(text);
  const encodedTitle = encodeURIComponent(title || text.split("\n")[0] || "Article");
  const textWithoutUrl = text.replace(articleUrl, "").trim();
  switch (platform) {
    case "x": return `https://twitter.com/intent/tweet?text=${encodeURIComponent(textWithoutUrl)}&url=${encodedUrl}`;
    case "linkedin": return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "whatsapp": return `https://wa.me/?text=${encodedText}`;
    case "telegram": return `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(textWithoutUrl)}`;
    case "facebook": return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "reddit": return `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
    case "email": return `mailto:?subject=${encodeURIComponent(title || text.split("\n")[0] || "Article")}&body=${encodedText}`;
  }
}

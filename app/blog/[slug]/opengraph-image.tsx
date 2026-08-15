import { ImageResponse } from "next/og";
import { getAllPosts, getCategory, getPost } from "@/lib/content";
import { siteConfig } from "@/lib/site";

export const runtime = "nodejs";
export const alt = "Gulshan Kumar technical article";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  const category = post ? getCategory(post.category) : undefined;
  const title = post?.title || siteConfig.name;
  const description = post?.description || siteConfig.tagline;
  const categoryName = category?.name || "Technical publication";

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", flexDirection: "column", justifyContent: "space-between", background: "#071426", color: "#f5f7fb", padding: "62px 72px", fontFamily: "Arial" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#e4c45d", fontSize: 22, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        <span>Gulshan Kumar</span>
        <span>Technical publication</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 1020 }}>
        <div style={{ display: "flex", marginBottom: 22, color: "#e4c45d", fontSize: 22, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{categoryName}</div>
        <div style={{ display: "flex", marginBottom: 20, fontSize: title.length > 60 ? 54 : 66, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1.02 }}>{title}</div>
        <div style={{ display: "flex", color: "#c5cfdd", fontSize: 25, lineHeight: 1.35 }}>{description}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #344b69", paddingTop: 22, color: "#aeb8c8", fontSize: 21 }}>
        <span>AI · software · technology · learning</span>
        <span>{siteConfig.url.replace(/^https?:\/\//, "")}</span>
      </div>
      <div style={{ position: "absolute", right: -70, bottom: -210, width: 500, height: 500, border: "2px solid #e4c45d", borderRadius: 9999, opacity: 0.35 }} />
      <div style={{ position: "absolute", right: 105, bottom: -55, width: 280, height: 280, border: "28px solid #263b59", borderRadius: 9999, opacity: 0.65 }} />
    </div>,
    { ...size },
  );
}

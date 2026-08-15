import Link from "next/link";
import type { TocItem } from "@/lib/content";

export function TableOfContents({ items }: { items: TocItem[] }) {
  if (!items.length) return null;
  return <nav className="toc" aria-label="Table of contents"><div className="toc-title">On this page</div><ol>{items.map((item) => <li key={item.slug}><Link className={item.depth === 3 ? "toc-sub" : undefined} href={`#${item.slug}`}>{item.text}</Link></li>)}</ol></nav>;
}

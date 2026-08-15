"use client";

import Link from "next/link";
import { ChevronDown, List } from "lucide-react";
import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/content";

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [open, setOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState(items[0]?.slug || "");

  useEffect(() => {
    const headings = items.map((item) => document.getElementById(item.slug)).filter((heading): heading is HTMLElement => Boolean(heading));
    if (!headings.length) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveSlug(visible[0].target.id);
    }, { rootMargin: "-112px 0px -58% 0px", threshold: [0, 1] });

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return <nav className={`toc${open ? " toc--open" : ""}`} aria-label="Table of contents"><button className="toc-toggle" type="button" aria-expanded={open} aria-controls="article-toc-list" onClick={() => setOpen((value) => !value)}><span><List size={15} aria-hidden="true" /> Table of Contents</span><ChevronDown size={16} aria-hidden="true" /></button><div className="toc-title">On this page</div><ol id="article-toc-list">{items.map((item) => <li key={item.slug}><Link className={activeSlug === item.slug ? "toc-link toc-link--active" : "toc-link"} href={`#${item.slug}`} aria-current={activeSlug === item.slug ? "location" : undefined} onClick={() => setOpen(false)}><span aria-hidden="true" className="toc-marker" />{item.text}</Link></li>)}</ol></nav>;
}

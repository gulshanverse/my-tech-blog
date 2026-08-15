"use client";

import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { siteConfig } from "@/lib/site";

const links = [
  { href: "/blog", label: "Blog" },
  { href: "/topics", label: "Topics" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container">
        <div className="nav-wrap">
          <Link className="brand" href="/" onClick={() => setOpen(false)} aria-label="Gulshan Kumar home">
            <span className="brand-mark" aria-hidden="true">GK</span>
            <span className="brand-text"><span className="brand-name">Gulshan Kumar</span><span className="brand-role">Technical publication</span></span>
          </Link>
          <nav className="nav-links" aria-label="Primary navigation">
            {links.map((link) => <Link key={link.href} className="nav-link" href={link.href} aria-current={pathname.startsWith(link.href) ? "page" : undefined}>{link.label}</Link>)}
            <Link className="nav-link" href="/search" aria-label="Search" aria-current={pathname === "/search" ? "page" : undefined}><Search size={16} strokeWidth={1.8} /></Link>
          </nav>
          <ThemeToggle />
          <Link className="nav-cta" href="/blog">Read the blog <span aria-hidden="true">↗</span></Link>
          <button className="menu-button" type="button" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close navigation" : "Open navigation"} onClick={() => setOpen((value) => !value)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
        {open && <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">{links.map((link) => <Link key={link.href} className="nav-link" href={link.href} aria-current={pathname.startsWith(link.href) ? "page" : undefined} onClick={() => setOpen(false)}>{link.label}</Link>)}<Link className="nav-link" href="/search" onClick={() => setOpen(false)}>Search</Link><ThemeToggle /></nav>}
      </div>
    </header>
  );
}

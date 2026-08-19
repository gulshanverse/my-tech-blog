"use client";

import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/site";

export function AuthorHeader() {
  async function logout() {
    await fetch("/api/author/auth/logout", { method: "POST" });
    window.location.href = "/author/login";
  }

  return <header className="author-topbar"><div className="author-brand"><span className="author-brand-mark" aria-hidden="true">GK</span><span className="author-topbar-context">GULSHANVERSE / AUTHOR STUDIO</span></div><div className="author-top-actions"><Link href={siteConfig.url} className="author-quiet-button"><span>View site</span><ExternalLink width={14} height={14} aria-hidden="true" /></Link><ThemeToggle /><button type="button" className="author-quiet-button" onClick={logout}><LogOut width={14} height={14} aria-hidden="true" /><span>Sign out</span></button></div></header>;
}

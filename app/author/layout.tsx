import type { Metadata } from "next";

export const metadata: Metadata = { title: "Author Studio — Gulshan Kumar", robots: { index: false, follow: false, nocache: true } };

export default function AuthorLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }

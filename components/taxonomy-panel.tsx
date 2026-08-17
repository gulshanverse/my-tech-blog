"use client";

import { useState } from "react";

type Taxonomy = { categories: Array<{ slug: string; name: string; count: number }>; tags: Array<{ label: string; count: number }> };

export function TaxonomyPanel({ onChanged }: { onChanged?: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadTaxonomy() {
    setOpen(true); if (taxonomy || busy) return; setBusy(true); setError("");
    const response = await fetch("/api/author/articles?mode=taxonomy", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error || "Unable to load taxonomy."); else setTaxonomy(body);
    setBusy(false);
  }

  async function renameTag(oldTag: string) {
    const newTag = window.prompt(`Rename “${oldTag}” to`, oldTag);
    if (!newTag || newTag.trim() === oldTag) return;
    setBusy(true); setError(""); setNotice("");
    const response = await fetch("/api/author/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "renameTag", oldTag, newTag: newTag.trim() }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error || "Unable to rename this tag."); else { setNotice(`${body.updated || 0} article${body.updated === 1 ? "" : "s"} updated.`); setTaxonomy(null); onChanged?.(); }
    setBusy(false);
  }

  return <div className="author-panel taxonomy-panel"><div className="eyebrow">Content settings</div><h2>Taxonomy</h2><p className="author-muted">Counts are derived from article frontmatter. Categories stay aligned with the public topic vocabulary; create and edit tags from an article, then rename them here consistently.</p><button className="author-quiet-button" type="button" onClick={loadTaxonomy} aria-expanded={open}>{open ? "Refresh taxonomy" : "Open taxonomy"}</button>{open && <div className="taxonomy-body">{busy && !taxonomy ? <p className="author-muted">Loading taxonomy…</p> : taxonomy && <><div className="taxonomy-section"><div className="eyebrow">Categories</div>{taxonomy.categories.map((category) => <div className="taxonomy-row" key={category.slug}><span><strong>{category.name}</strong><small>{category.slug}</small></span><b>{category.count} article{category.count === 1 ? "" : "s"}</b></div>)}</div><div className="taxonomy-section"><div className="eyebrow">Tags</div>{taxonomy.tags.map((tag) => <div className="taxonomy-row" key={tag.label.toLowerCase()}><span><strong>{tag.label}</strong></span><b>{tag.count}</b><button className="author-quiet-button" type="button" onClick={() => void renameTag(tag.label)} disabled={busy}>Rename</button></div>)}</div></>}{notice && <p className="author-notice" role="status">{notice}</p>}{error && <p className="form-error" role="alert">{error}</p>}</div>}</div>;
}

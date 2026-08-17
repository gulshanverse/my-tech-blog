"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { generateShareContent, type ShareArticle, type ShareContent, type SharePlatform } from "@/lib/share-content";
import { buildShareUrl } from "@/lib/share-urls";

const platforms: Array<{ id: SharePlatform; label: string; limit?: number }> = [
  { id: "x", label: "X", limit: 280 },
  { id: "linkedin", label: "LinkedIn" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "telegram", label: "Telegram" },
  { id: "facebook", label: "Facebook" },
  { id: "reddit", label: "Reddit" },
  { id: "email", label: "Email" },
];

type Props = { article: ShareArticle; onClose?: () => void };

function draftText(content: ShareContent) { return content.platform === "reddit" && content.title ? `${content.title}\n\n${content.text}` : content.text; }

export function ShareStudio({ article, onClose }: Props) {
  const articleKey = [article.slug, article.title, article.description, article.category, article.tags?.join("|"), article.content, article.coverImage].join("\u0000");
  const generated = useMemo(() => Object.fromEntries(platforms.map(({ id }) => [id, generateShareContent(article, id)])) as Record<SharePlatform, ShareContent>, [articleKey]);
  const [active, setActive] = useState<SharePlatform>("x");
  const [drafts, setDrafts] = useState<Record<SharePlatform, string>>(() => Object.fromEntries(platforms.map(({ id }) => [id, draftText(generated[id])])) as Record<SharePlatform, string>);
  const [copied, setCopied] = useState<SharePlatform | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => { setDrafts(Object.fromEntries(platforms.map(({ id }) => [id, draftText(generated[id])])) as Record<SharePlatform, string>); }, [articleKey, generated]);

  const activePlatform = platforms.find((platform) => platform.id === active) || platforms[0];
  const activeContent = generated[active];
  const activeText = drafts[active] || "";

  function updateDraft(value: string) { setDrafts((current) => ({ ...current, [active]: value })); setCopied(null); setStatus(""); }
  function regenerate() { setDrafts((current) => ({ ...current, [active]: draftText(generateShareContent(article, active)) })); setCopied(null); setStatus(`${activePlatform.label} post regenerated from the current article.`); }
  async function copyText() {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(activeText);
      else throw new Error("Clipboard API unavailable");
      setCopied(active); setStatus(`${activePlatform.label} post copied to clipboard.`); window.setTimeout(() => setCopied(null), 2200);
    } catch {
      const fallback = document.createElement("textarea"); fallback.value = activeText; fallback.setAttribute("readonly", "true"); fallback.style.position = "fixed"; fallback.style.opacity = "0"; document.body.appendChild(fallback); fallback.select();
      const copiedWithFallback = document.execCommand("copy"); fallback.remove();
      if (copiedWithFallback) { setCopied(active); setStatus(`${activePlatform.label} post copied to clipboard.`); window.setTimeout(() => setCopied(null), 2200); }
      else setStatus("Unable to copy automatically. Select the text and copy it manually.");
    }
  }
  async function openPlatform() {
    const destination = buildShareUrl(active, activeContent.articleUrl, activeText, activeContent.title || article.title);
    const opened = window.open(destination, "_blank", "noopener,noreferrer");
    if (!opened) { await copyText(); setStatus("Unable to open the sharing window. The post has been copied so you can paste it manually."); }
  }

  return <section className="share-studio author-panel" aria-labelledby="share-studio-heading">
    <div className="share-studio-heading"><div><div className="eyebrow">Private publishing assistant</div><h2 id="share-studio-heading">Share this article</h2><p>Prepare editable, platform-specific copy from the published article. Nothing is posted automatically.</p></div>{onClose && <button type="button" className="author-quiet-button" onClick={onClose}>Close</button>}</div>
    <div className="share-studio-preview"><div className="share-studio-preview-image">{article.coverImage ? <Image src={article.coverImage} alt="" fill sizes="96px" /> : <span>No cover image configured</span>}</div><div><strong>{article.title || "Untitled article"}</strong><p>{article.description || "No article description configured."}</p><span>{article.authorName || "Gulshan Kumar"} · gulshanblogs.vercel.app</span></div></div>
    <div className="share-studio-tabs" role="tablist" aria-label="Sharing platforms">{platforms.map((platform) => <button type="button" key={platform.id} role="tab" aria-selected={active === platform.id} className={active === platform.id ? "active" : ""} onClick={() => { setActive(platform.id); setStatus(""); }}>{platform.label}</button>)}</div>
    <div className="share-studio-editor"><label htmlFor={`share-copy-${active}`}>{activePlatform.label} post</label>{active === "reddit" && <p className="author-muted">Discussion-oriented copy; review the title and body before opening Reddit.</p>}<textarea id={`share-copy-${active}`} value={activeText} onChange={(event) => updateDraft(event.target.value)} rows={active === "linkedin" || active === "email" ? 11 : 8} aria-describedby="share-copy-help" /> <div className="share-studio-editor-footer"><span id="share-copy-help">{activePlatform.limit ? `${activeText.length} / ${activePlatform.limit} characters${activeText.length > activePlatform.limit ? " · Above recommended limit" : ""}` : `${activeText.length} characters`}</span><button type="button" className="author-quiet-button" onClick={regenerate}><RefreshCw size={14} aria-hidden="true" /> Regenerate</button></div></div>
    <div className="share-studio-actions"><button type="button" className="author-quiet-button" onClick={copyText}>{copied === active ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} {copied === active ? "Copied" : active === "email" ? "Copy email" : "Copy post"}</button><button type="button" className="btn btn-primary" onClick={() => void openPlatform()}><ExternalLink size={14} aria-hidden="true" /> {active === "email" ? "Open email" : `Open ${activePlatform.label}`}</button></div>
    <p className="share-studio-status" role="status" aria-live="polite">{status}</p>
  </section>;
}

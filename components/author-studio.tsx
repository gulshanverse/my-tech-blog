"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, ArrowLeft, BarChart3, Check, Copy, ExternalLink, Eye, FilePlus2, Save, Send, Share2, Trash2 } from "lucide-react";
import { AuthorPreview } from "@/components/author-preview";
import { CoverImageUpload } from "@/components/cover-image-upload";
import { RevisionHistory } from "@/components/revision-history";
import { TaxonomyPanel } from "@/components/taxonomy-panel";
import { ShareStudio } from "@/components/share-studio";
import { ArticleIntelligence } from "@/components/article-intelligence";
import { AuthorHeader } from "@/components/author-header";
import { categoryMeta, siteConfig, type CategorySlug } from "@/lib/site";
import { canAutoSaveDraft, scheduleAutoSave } from "@/lib/author-autosave";
import { DIFFICULTY_OPTIONS, parseReadingTime, type Difficulty } from "@/lib/article-metadata";
import type { ArticleDraftInput } from "@/lib/author-articles";

type ListedArticle = { post: { slug: string; title: string; description: string; date: string; updatedAt?: string; category: CategorySlug; tags: string[]; readingTime: number; status: "draft" | "published"; coverImage: string; coverAlt?: string; difficulty?: Difficulty; featured: boolean; content: string }; path: string; sha: string };
type Validation = { valid: boolean; errors: string[]; checks: Record<string, boolean> };

type Props = { initialView?: "dashboard" | "editor"; initialPath?: string };
const blankInput: ArticleDraftInput = { title: "", slug: "", category: "ai", tags: "", description: "", coverImage: "", coverAlt: "", readingTime: "1", difficulty: "", status: "draft", content: "", date: new Date().toISOString().slice(0, 10), updatedAt: "", featured: false };

function inputFromPost(post: ListedArticle["post"]): ArticleDraftInput { return { title: post.title, slug: post.slug, category: post.category, tags: post.tags.join(", "), description: post.description, coverImage: post.coverImage, coverAlt: post.coverAlt || "", readingTime: String(post.readingTime), difficulty: post.difficulty || "", status: post.status, content: post.content, date: post.date, updatedAt: post.updatedAt || "", featured: post.featured }; }
function dateLabel(value: string) { return value ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "No date"; }

export function AuthorStudio({ initialView = "dashboard", initialPath = "" }: Props) {
  const [view, setView] = useState<"dashboard" | "editor" | "preview">(initialView);
  const [articles, setArticles] = useState<ListedArticle[]>([]);
  const [input, setInput] = useState<ArticleDraftInput>(blankInput);
  const [path, setPath] = useState("");
  const [sha, setSha] = useState("");
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | CategorySlug>("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "updated" | "titleAsc" | "titleDesc">("newest");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [validation, setValidation] = useState<Validation | null>(null);
  const [saveState, setSaveState] = useState("Unsaved changes");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState("Unsaved changes");
  const [autoSaveError, setAutoSaveError] = useState("");

  async function loadArticles() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/author/articles", { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) setError(body.error || "Unable to load articles."); else setArticles(body.articles || []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load articles. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const autoSaveDraft = useCallback(async () => {
    if (input.status !== "draft" || busy) return;
    setAutoSaveState("Saving…"); setAutoSaveError("");
    try {
      const method = path ? "PUT" : "POST";
      const response = await fetch("/api/author/articles", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(path ? { path, sha, input, confirmed: false } : { input }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) { setAutoSaveState("Save failed"); setAutoSaveError(body.error || "Autosave failed. Your local draft is preserved; retry manually when ready."); return; }
      setPath(body.path || path); setSha(body.sha || sha); setAutoSaveState("Saved just now"); setSaveState("Saved to GitHub"); window.localStorage.removeItem("gulshan-author-draft");
    } catch (reason) {
      setAutoSaveState("Save failed"); setAutoSaveError(reason instanceof Error ? reason.message : "Autosave failed. Your local draft is preserved; retry manually when ready.");
    }
  }, [input, busy, path, sha]);
  const autoSaveRef = useRef(autoSaveDraft);
  useEffect(() => { autoSaveRef.current = autoSaveDraft; }, [autoSaveDraft]);
  useEffect(() => {
    void loadArticles();
    const saved = window.localStorage.getItem("gulshan-author-draft");
    if (saved && initialView === "editor" && !initialPath) { try { setInput(JSON.parse(saved)); setNotice("Recovered a local unsaved draft."); setAutoSaveState("Saved locally"); } catch { window.localStorage.removeItem("gulshan-author-draft"); } }
    if (initialPath) {
      void (async () => {
        setBusy(true); setError("");
        try {
          const response = await fetch(`/api/author/articles?path=${encodeURIComponent(initialPath)}`, { cache: "no-store" });
          const body = await response.json().catch(() => ({}));
          if (response.ok) { setInput(body.input); setPath(body.path); setSha(body.sha); setView("editor"); } else setError(body.error || "Unable to open article.");
        } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to open article. Check your connection and try again."); }
        finally { setBusy(false); }
      })();
    }
  }, [initialView, initialPath]);
  useEffect(() => { if (view !== "editor") return; setSaveState("Unsaved changes"); setAutoSaveState("Unsaved changes"); setAutoSaveError(""); const scheduler = scheduleAutoSave(() => { window.localStorage.setItem("gulshan-author-draft", JSON.stringify(input)); setAutoSaveState("Saved locally"); if (canAutoSaveDraft(input)) void autoSaveRef.current(); }); scheduler.schedule(); return scheduler.cancel; }, [input, view]);

  const availableTags = useMemo(() => Array.from(new Set(articles.flatMap(({ post }) => post.tags))).sort((a, b) => a.localeCompare(b)), [articles]);
  const filteredArticles = useMemo(() => articles.filter(({ post }) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${post.title} ${post.slug} ${post.description} ${post.category} ${post.tags.join(" ")}`.toLowerCase().includes(query);
    return (filter === "all" || post.status === filter) && (categoryFilter === "all" || post.category === categoryFilter) && (tagFilter === "all" || post.tags.some((tag) => tag.toLowerCase() === tagFilter.toLowerCase())) && matchesSearch;
  }).sort((a, b) => {
    if (sort === "titleAsc" || sort === "titleDesc") { const result = a.post.title.localeCompare(b.post.title); return sort === "titleAsc" ? result : -result; }
    const left = sort === "updated" ? a.post.updatedAt || a.post.date : a.post.date;
    const right = sort === "updated" ? b.post.updatedAt || b.post.date : b.post.date;
    return sort === "oldest" ? new Date(left).getTime() - new Date(right).getTime() : new Date(right).getTime() - new Date(left).getTime();
  }), [articles, filter, categoryFilter, tagFilter, search, sort]);
  const draftCount = articles.filter(({ post }) => post.status === "draft").length;
  const publishedCount = articles.filter(({ post }) => post.status === "published").length;
  const articleUrl = input.status === "published" && input.slug ? `${siteConfig.url}/blog/${input.slug}` : publishedUrl;

  function update(field: keyof ArticleDraftInput, value: string | boolean) { setInput((current) => ({ ...current, [field]: value })); setValidation(null); setNotice(""); setError(""); }
  function newArticle() { setInput({ ...blankInput, date: new Date().toISOString().slice(0, 10) }); setPath(""); setSha(""); setValidation(null); setPublishedUrl(""); setShareOpen(false); setNotice(""); setError(""); setView("editor"); }
  async function openArticle(article: ListedArticle) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/author/articles?path=${encodeURIComponent(article.path)}`, { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) setError(body.error || "Unable to open article."); else { setInput(body.input); setPath(body.path); setSha(body.sha); setValidation(null); setPublishedUrl(""); setShareOpen(false); setView("editor"); }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to open article. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function validate() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/author/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "validate", input, path }) });
      const body = await response.json().catch(() => ({}));
      if (body.validation) setValidation(body.validation);
      if (!response.ok) setError(body.error || "Unable to validate the article.");
      return body.validation as Validation | undefined;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to validate the article. Check your connection and try again.");
      return undefined;
    } finally {
      setBusy(false);
    }
  }
  async function save(status: "draft" | "published", confirmed = false) {
    setBusy(true); setError(""); setNotice("");
    const nextInput = { ...input, status, updatedAt: status === "published" ? new Date().toISOString().slice(0, 10) : input.updatedAt };
    try {
      const method = path ? "PUT" : "POST";
      const response = await fetch("/api/author/articles", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(path ? { path, sha, input: nextInput, confirmed } : { input: nextInput }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error || "The article was not saved.");
        if (body.requiresConfirmation && window.confirm("This will overwrite the published version. Continue?")) { setBusy(false); return save(status, true); }
        return;
      }
      setInput(nextInput); setPath(body.path); setSha(body.sha || sha); window.localStorage.removeItem("gulshan-author-draft"); setSaveState("Saved to GitHub"); setNotice(status === "published" ? "Published successfully. A deployment will update the public blog, RSS, sitemap, and social metadata." : "Draft saved to GitHub.");
      if (status === "published") { setPublishedUrl(`${siteConfig.url}/blog/${nextInput.slug}`); setShareOpen(true); }
      await loadArticles();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The article was not saved. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }
  async function duplicate() {
    const newSlug = window.prompt("New slug for this draft", `${input.slug}-copy`); if (!newSlug || !path) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/author/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "duplicate", path, newSlug }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) setError(body.error || "Unable to duplicate the article."); else { setNotice("Draft duplicated."); await loadArticles(); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to duplicate the article. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  async function deleteDraft() {
    if (!path || input.status !== "draft" || !window.confirm("Delete this draft from GitHub? This cannot be undone.")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/author/articles", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, sha }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) setError(body.error || "Unable to delete the draft."); else { setNotice("Draft deleted."); await loadArticles(); setView("dashboard"); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete the draft. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  async function deleteVisibleDrafts() {
    const visibleDrafts = filteredArticles.filter(({ post }) => post.status === "draft"); if (!visibleDrafts.length || !window.confirm(`Delete ${visibleDrafts.length} visible draft${visibleDrafts.length === 1 ? "" : "s"} from GitHub? This cannot be undone.`)) return;
    setBulkBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/author/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bulkDelete", paths: visibleDrafts.map(({ path }) => path) }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) setError(body.error || "Unable to delete the visible drafts."); else { setNotice(`${body.deleted || 0} draft${body.deleted === 1 ? "" : "s"} deleted.`); await loadArticles(); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete the visible drafts. Check your connection and try again."); }
    finally { setBulkBusy(false); }
  }
  if (view === "preview") return <main className="author-workspace"><AuthorHeader /><div className="author-preview-nav"><button type="button" className="author-quiet-button" onClick={() => setView("editor")}><ArrowLeft width={15} height={15} aria-hidden="true" /> Return to edit</button></div><AuthorPreview input={input} /></main>;

  return <main className="author-workspace"><AuthorHeader />{view === "dashboard" ? <section className="author-dashboard container"><div className="author-masthead"><span className="author-masthead-mark" aria-hidden="true">GK</span><div className="eyebrow">Gulshan Kumar · @gulshanverse</div><h1>Author Studio</h1><p>Private publishing workspace for writing, validating, and shipping thoughtful technical articles.</p></div><div className="author-heading"><div><div className="eyebrow">Archive desk</div><h2>Write with intent.</h2><p>Manage the archive, keep drafts private, and publish only when the article is ready.</p></div><div className="author-heading-actions"><button className="btn btn-primary" onClick={newArticle}><FilePlus2 width={16} height={16} aria-hidden="true" /> New article</button><Link href="/author/analytics" className="author-quiet-button"><BarChart3 width={16} height={16} aria-hidden="true" /> View Analytics</Link></div></div>{error && <p className="form-error" role="alert"><AlertCircle size={15} /> {error}</p>}<div className="author-stats"><div><span>Drafts</span><strong>{draftCount}</strong></div><div><span>Published</span><strong>{publishedCount}</strong></div><div><span>Total articles</span><strong>{articles.length}</strong></div></div><ArticleIntelligence mode="dashboard" articles={articles} /><div className="author-toolbar"><div className="author-filters">{(["all", "draft", "published"] as const).map((item) => <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item === "all" ? "All" : item[0].toUpperCase() + item.slice(1)}</button>)}</div><label className="author-search-field"><span className="sr-only">Search articles</span><input aria-label="Search articles" placeholder="Search articles…" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setSearch(""); }} /></label><select aria-label="Filter by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as "all" | CategorySlug)}><option value="all">All categories</option>{Object.values(categoryMeta).map((category) => <option value={category.slug} key={category.slug}>{category.name}</option>)}</select><select aria-label="Filter by tag" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}><option value="all">All tags</option>{availableTags.map((tag) => <option value={tag} key={tag}>{tag}</option>)}</select><select aria-label="Sort articles" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="updated">Recently updated</option><option value="titleAsc">Title A–Z</option><option value="titleDesc">Title Z–A</option></select>{filter === "draft" && filteredArticles.some(({ post }) => post.status === "draft") && <button className="author-danger-button" onClick={deleteVisibleDrafts} disabled={bulkBusy}>{bulkBusy ? "Deleting…" : "Delete visible drafts"}</button>}</div><div className="author-article-list">{busy && !articles.length ? <p>Loading articles…</p> : filteredArticles.map(({ post, path }) => <button className="author-article-row" key={path} onClick={() => openArticle({ post, path, sha: "" })}><span className={`status-dot status-${post.status}`} aria-hidden="true" /><span className="author-article-main"><strong>{post.title}</strong><span>{post.status === "published" ? "Published" : "Draft"} · {dateLabel(post.updatedAt || post.date)} · {post.category}</span></span><span className="author-row-arrow">Open <ExternalLink size={14} /></span></button>)}{!filteredArticles.length && !busy && <div className="author-empty"><p>No articles found.</p><p>Try a different title, tag, category, or search term.</p><button className="section-link" onClick={newArticle}>Start a new draft <FilePlus2 size={15} /></button></div>}</div><TaxonomyPanel onChanged={() => void loadArticles()} /></section> : <section className="author-editor container"><div className="author-editor-heading"><button className="author-quiet-button" onClick={() => setView("dashboard")}><ArrowLeft size={15} /> Articles</button><div className="author-editor-actions"><span className={`author-save-state ${autoSaveState.includes("Saved") ? "is-saved" : ""}`} role="status" aria-live="polite">{autoSaveState}</span><button className="author-quiet-button" onClick={() => setView("preview")}><Eye size={15} /> Preview</button><button className="author-quiet-button" onClick={validate} disabled={busy}><Check size={15} /> Validate</button><button className="author-quiet-button" onClick={() => save("draft")} disabled={busy}><Save size={15} /> Save draft</button><button className="btn btn-primary" onClick={async () => { const result = await validate(); if (result?.valid) await save("published"); }} disabled={busy}><Send size={15} /> Publish</button></div></div>{autoSaveError && <p className="form-error" role="alert"><AlertCircle size={15} /> {autoSaveError} <button className="section-link" type="button" onClick={() => void autoSaveDraft()}>Retry autosave</button></p>}{notice && <p className="author-notice" role="status"><Check size={15} /> {notice}</p>}{error && <p className="form-error" role="alert"><AlertCircle size={15} /> {error}</p>}<div className="author-editor-grid"><form className="author-form author-fields" onSubmit={(event) => { event.preventDefault(); void save("draft"); }}><label>Title<input value={input.title} onChange={(event) => update("title", event.target.value)} placeholder="A clear article title" required /></label><label>Slug<input value={input.slug} onChange={(event) => update("slug", event.target.value)} placeholder="lowercase-article-slug" required /><small>Use lowercase letters, numbers, and hyphens.</small></label><div className="author-field-grid"><label>Category<select value={input.category} onChange={(event) => update("category", event.target.value as CategorySlug)}>{Object.values(categoryMeta).map((category) => <option value={category.slug} key={category.slug}>{category.name}</option>)}</select></label><label>Reading time<div className="reading-time-stepper"><button type="button" aria-label="Decrease reading time" onClick={() => update("readingTime", String(Math.max(1, (parseReadingTime(input.readingTime) || 1) - 1)))} disabled={(parseReadingTime(input.readingTime) || 1) <= 1}>−</button><input aria-label="Reading time in minutes" type="number" min="1" step="1" inputMode="numeric" value={input.readingTime} onChange={(event) => { const value = event.target.value.replace(/\D/g, ""); update("readingTime", value ? String(Math.max(1, Number(value))) : "1"); }} required /><button type="button" aria-label="Increase reading time" onClick={() => update("readingTime", String((parseReadingTime(input.readingTime) || 1) + 1))}>+</button></div><small>Minutes only. Public articles display “min read”.</small></label><label>Status<select value={input.status} onChange={(event) => update("status", event.target.value as "draft" | "published")}><option value="draft">Draft</option><option value="published">Published</option></select></label></div><label>Tags<input value={input.tags} onChange={(event) => update("tags", event.target.value)} placeholder="RAG, LLM, AI Engineering" required /><small>Separate tags with commas.</small></label><label>Description / excerpt<textarea rows={3} value={input.description} onChange={(event) => update("description", event.target.value)} required /></label><div className="author-media-field"><label>Cover image</label><CoverImageUpload slug={input.slug} value={input.coverImage} onChange={(value) => update("coverImage", value)} /></div><div className="author-field-grid"><label>Difficulty<select aria-label="Difficulty" value={input.difficulty} onChange={(event) => update("difficulty", event.target.value as Difficulty | "")}><option value="">Select difficulty</option>{DIFFICULTY_OPTIONS.map((option) => <option value={option} key={option}>{option}</option>)}</select></label></div><label>Cover image alt text<input value={input.coverAlt} onChange={(event) => update("coverAlt", event.target.value)} required /></label><label>Article content <textarea className="author-mdx-editor" value={input.content} onChange={(event) => update("content", event.target.value)} placeholder="Write MDX here…" spellCheck={false} required /></label><label className="author-check-label"><input type="checkbox" checked={input.featured} onChange={(event) => update("featured", event.target.checked)} /> Feature this article in the public archive</label></form><aside className="author-sidebar"><ArticleIntelligence mode="editor" articles={articles} input={input} currentPath={path} /><div className="author-panel"><div className="eyebrow">Publish check</div><h2>Ready when it is true.</h2>{validation ? <div className="validation-list">{Object.entries(validation.checks).map(([key, passed]) => <div key={key} className={passed ? "validation-pass" : "validation-fail"}><span>{passed ? "✓" : "!"}</span>{key === "mdx" ? "Valid MDX" : key === "openGraph" ? "Open Graph metadata" : key === "canonical" ? "Canonical URL" : key[0].toUpperCase() + key.slice(1)}</div>)}</div> : <p className="author-muted">Run validation before publishing to check metadata, content, MDX, canonical URL, and social metadata.</p>}{validation?.errors.map((item) => <p className="form-error" key={item}>{item}</p>)}</div><div className="author-panel"><div className="eyebrow">Article actions</div><h2>{input.status === "published" ? "Published article" : "Draft article"}</h2>{path && input.status === "draft" && <><button className="author-danger-button" onClick={deleteDraft} disabled={busy}><Trash2 size={14} /> Delete draft</button><p className="author-muted">Sharing becomes available after publication.</p></>}{path && <button className="author-quiet-button" onClick={duplicate} disabled={busy}><Copy size={14} /> Duplicate as draft</button>}{input.status === "published" && <>{articleUrl && <Link href={articleUrl} target="_blank" rel="noreferrer" className="author-quiet-button">Open article <ExternalLink size={14} /></Link>}<button className="author-quiet-button" onClick={() => setShareOpen(true)}><Share2 size={14} /> Share article</button></>}</div>{shareOpen && input.status === "published" && <ShareStudio article={{ title: input.title, slug: input.slug, description: input.description, category: input.category, tags: input.tags.split(/[,\n]/).map((tag) => tag.trim()).filter(Boolean), readingTime: input.readingTime, difficulty: input.difficulty, coverImage: input.coverImage, content: input.content, authorName: siteConfig.name }} onClose={() => setShareOpen(false)} />}{path && <RevisionHistory path={path} currentInput={input} onRestored={(restoredInput, restoredPath, restoredSha) => { setInput(restoredInput); setPath(restoredPath); setSha(restoredSha); setAutoSaveState("Saved to GitHub"); setNotice("Revision restored in a new GitHub commit."); }} />}<SocialPreview input={input} /></aside></div></section>}</main>;
}

function SocialPreview({ input }: { input: ArticleDraftInput }) { return <div className="author-panel"><div className="eyebrow">Social preview</div><div className="social-preview"><div className="social-preview-image">{input.coverImage ? <Image src={input.coverImage} alt="" fill sizes="280px" /> : <span>Article image</span>}</div><strong>{input.title || "Article title"}</strong><span>gulshanblogs.vercel.app</span><p>{input.description || "Article description will appear here."}</p></div></div>; }

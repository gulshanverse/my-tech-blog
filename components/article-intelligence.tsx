"use client";

import Link from "next/link";
import { AlertTriangle, Check, Clock3, FileText, Gauge, Link2, Sparkles } from "lucide-react";
import { buildArticleQuality, getArticleStatuses, getContentStats, getDashboardOverview, getInsightsState, getPublishingChecklist, getRelatedEditorialArticles, getTitleSimilarity, type EditorialArticle } from "@/lib/article-intelligence";
import type { ArticleDraftInput } from "@/lib/author-articles";

type ArticleRow = { post: EditorialArticle; path: string };
type Props = { mode: "dashboard" | "editor"; articles: ArticleRow[]; input?: ArticleDraftInput; currentPath?: string };

function StateMark({ state }: { state: "PASS" | "WARNING" | "NEEDS ATTENTION" }) {
  return state === "PASS" ? <Check size={14} aria-hidden="true" /> : <AlertTriangle size={14} aria-hidden="true" />;
}
function statusTone(state: string) { return state === "PASS" ? "intelligence-pass" : state === "WARNING" ? "intelligence-warning" : "intelligence-attention"; }
function articleHref(row: ArticleRow) { return `/author/editor?path=${encodeURIComponent(row.path)}`; }

function DashboardIntelligence({ articles }: { articles: ArticleRow[] }) {
  const overview = getDashboardOverview(articles.map(({ post }) => post));
  const insights = getInsightsState();
  return <div className="author-intelligence-dashboard">
    <section className="author-intelligence-overview author-panel" aria-labelledby="content-overview-heading">
      <div className="intelligence-section-heading"><div><div className="eyebrow">Editorial control center</div><h2 id="content-overview-heading">Content overview</h2><p>Counts and editorial states derived from the current article repository.</p></div><Gauge size={20} aria-hidden="true" /></div>
      <div className="intelligence-metric-grid"><div><span>Drafts</span><strong>{overview.drafts}</strong></div><div><span>Published</span><strong>{overview.published}</strong></div><div><span>Total articles</span><strong>{overview.total}</strong></div><div><span>Featured</span><strong>{overview.featured}</strong></div><div><span>Recently updated</span><strong>{overview.recentlyUpdated.length}</strong></div></div>
    </section>
    <div className="author-intelligence-columns"><section className="author-panel" aria-labelledby="insights-heading"><div className="eyebrow">Private insights</div><h2 id="insights-heading">Search performance</h2><div className="intelligence-empty"><Sparkles size={18} aria-hidden="true" /><p>{insights.message}</p><small>Ownership verification is active, but API analytics credentials are not configured in this application.</small></div></section><section className="author-panel" aria-labelledby="featured-heading"><div className="eyebrow">Editorial curation</div><h2 id="featured-heading">Featured articles</h2><div className="intelligence-split-list"><div><strong>Featured</strong>{overview.featuredArticles.length ? overview.featuredArticles.map((article) => <span key={article.slug}>{article.title}</span>) : <small>No featured articles.</small>}</div><div><strong>Non-featured</strong>{overview.nonFeaturedArticles.slice(0, 5).map((article) => <span key={article.slug}>{article.title}</span>)}</div></div></section></div>
    <section className="author-panel" aria-labelledby="timeline-heading"><div className="intelligence-section-heading"><div><div className="eyebrow">Archive movement</div><h2 id="timeline-heading">Content timeline</h2><p>Published and draft dates from article frontmatter.</p></div><Clock3 size={20} aria-hidden="true" /></div><div className="author-timeline">{overview.timeline.slice(0, 8).map((article) => <Link href={`/author/editor?path=${encodeURIComponent(articles.find((row) => row.post.slug === article.slug)?.path || "")}`} className="author-timeline-item" key={article.slug}><time dateTime={article.date}>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(article.date))}</time><span><strong>{article.title}</strong><small>{getArticleStatuses(article).join(" · ")}</small></span></Link>)}</div></section>
    <section className="author-panel" aria-labelledby="recent-heading"><div className="eyebrow">Editorial queue</div><h2 id="recent-heading">Recently updated</h2><div className="recently-updated-list">{overview.recentlyUpdated.map((article) => <Link href={`/author/editor?path=${encodeURIComponent(articles.find((row) => row.post.slug === article.slug)?.path || "")}`} key={article.slug}><strong>{article.title}</strong><span>{article.status === "published" ? "Published" : "Draft"} · {article.category} · {article.updatedAt || article.date}</span></Link>)}</div></section>
  </div>;
}

function EditorIntelligence({ input, articles, currentPath }: { input: ArticleDraftInput; articles: ArticleRow[]; currentPath?: string }) {
  const quality = buildArticleQuality(input);
  const checklist = getPublishingChecklist(input, { canonicalUrl: input.slug ? `https://gulshanblogs.vercel.app/blog/${input.slug}` : "" });
  const stats = getContentStats(input);
  const similar = getTitleSimilarity(input.title, articles.filter(({ path }) => path !== currentPath).map(({ post }) => post.title));
  const related = getRelatedEditorialArticles(input as unknown as EditorialArticle, articles.filter(({ path }) => path !== currentPath).map(({ post }) => post));
  const tags = input.tags.split(/[,\n]/).map((tag) => tag.trim()).filter(Boolean);
  return <div className="author-intelligence-editor">
    <section className="author-panel" aria-labelledby="quality-heading"><div className="intelligence-section-heading"><div><div className="eyebrow">Publishing quality</div><h2 id="quality-heading">Article quality</h2></div><strong className="intelligence-score" aria-label={`Article health ${quality.score} out of 100`}>{quality.score}<small>/100</small></strong></div><div className="quality-summary"><span className="intelligence-pass">{quality.passed} pass</span><span className="intelligence-warning">{quality.warnings} warning</span><span className="intelligence-attention">{quality.attention} needs attention</span></div><div className="quality-list">{quality.checks.map((check) => <div className={statusTone(check.state)} key={check.id}><StateMark state={check.state} /><span><strong>{check.label}</strong>{check.detail && <small>{check.detail}</small>}</span></div>)}</div></section>
    <section className="author-panel" aria-labelledby="checklist-heading"><div className="eyebrow">Preflight</div><h2 id="checklist-heading">Publishing checklist</h2><div className="checklist-groups">{checklist.map((group) => <div key={group.group}><strong>{group.group}</strong>{group.items.map((item) => <span className={statusTone(item.state)} key={item.label}><StateMark state={item.state} />{item.label}</span>)}</div>)}</div></section>
    <section className="author-panel" aria-labelledby="metrics-heading"><div className="eyebrow">Editorial signals</div><h2 id="metrics-heading">Article metrics</h2><div className="editor-metric-grid"><span><strong>{stats.descriptionCharacters}</strong>Description characters</span><span><strong>{tags.length}</strong>Tags</span><span><strong>{stats.words}</strong>Words</span><span><strong>{stats.estimatedReadingTime} min</strong>Estimated read</span><span><strong>{stats.headings}</strong>Sections</span><span><strong>{stats.images}</strong>Images</span><span><strong>{stats.codeBlocks}</strong>Code blocks</span><span><strong>{stats.internalLinks}</strong>Internal links</span></div><p className="author-muted">Description guidance: approximately 120–160 characters. These are editorial signals, not publishing blockers.</p></section>
    {similar && <section className="author-panel intelligence-similarity" aria-labelledby="similar-heading"><div className="eyebrow">Title review</div><h2 id="similar-heading">Similar article found</h2><p><strong>“{similar.title}”</strong> has similar wording ({Math.round(similar.score * 100)}% token overlap). This is a deterministic warning, not plagiarism detection.</p></section>}
    <section className="author-panel" aria-labelledby="related-editorial-heading"><div className="eyebrow">Internal linking</div><h2 id="related-editorial-heading">Related articles</h2>{related.length ? <div className="related-editorial-list">{related.map(({ article, reason }) => <Link href={`/blog/${article.slug}`} target="_blank" rel="noreferrer" key={article.slug}><Link2 size={14} aria-hidden="true" /><span><strong>{article.title}</strong><small>{reason} · {article.category}</small></span></Link>)}</div> : <p className="author-muted">No related published articles found from the current category and tags.</p>}<p className="author-muted">Recommendations are informational and do not modify article content.</p></section>
  </div>;
}

export function ArticleIntelligence({ mode, articles, input, currentPath }: Props) {
  if (mode === "dashboard") return <DashboardIntelligence articles={articles} />;
  if (!input) return null;
  return <EditorIntelligence input={input} articles={articles} currentPath={currentPath} />;
}

"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArticleResultCard } from "@/components/article-result-card";
import { type Post } from "@/lib/content";

export type ExplorerCategory = { slug: string; shortName: string };

type ArticleExplorerProps = {
  posts: Post[];
  categories?: ExplorerCategory[];
  tags?: string[];
  initialQuery?: string;
  initialCategory?: string;
  initialTag?: string;
  mode?: "archive" | "search";
};

function normalize(value: string) {
  return value.toLocaleLowerCase().trim();
}

export function ArticleExplorer({ posts, categories = [], tags = [], initialQuery = "", initialCategory = "", initialTag = "", mode = "archive" }: ArticleExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [tag, setTag] = useState(initialTag);

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
    setCategory(searchParams.get("category") || "");
    setTag(searchParams.get("tag") || "");
  }, [searchParams]);

  function updateUrl(next: { query?: string; category?: string; tag?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const values = { query, category, tag, ...next };
    if (values.query.trim()) params.set("q", values.query.trim()); else params.delete("q");
    if (values.category) params.set("category", values.category); else params.delete("category");
    if (values.tag) params.set("tag", values.tag); else params.delete("tag");
    const serialized = params.toString();
    router.replace(serialized ? `${pathname}?${serialized}` : pathname, { scroll: false });
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    updateUrl({ query: value });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateUrl({ query });
  }

  function handleCategoryChange(value: string) {
    const next = category === value ? "" : value;
    setCategory(next);
    updateUrl({ category: next });
  }

  function handleTagChange(value: string) {
    const next = tag === value ? "" : value;
    setTag(next);
    updateUrl({ tag: next });
  }

  function clearFilters() {
    setQuery("");
    setCategory("");
    setTag("");
    router.replace(pathname, { scroll: false });
  }

  const filteredPosts = useMemo(() => {
    const tokens = normalize(query).split(/\s+/).filter(Boolean);
    const normalizedCategory = normalize(category);
    const normalizedTag = normalize(tag);

    return posts.filter((post) => {
      const searchableText = normalize([post.title, post.description, post.content, post.category, post.tags.join(" ")].join(" "));
      const matchesQuery = tokens.length === 0 || tokens.every((token) => searchableText.includes(token));
      const matchesCategory = !normalizedCategory || normalize(post.category) === normalizedCategory;
      const matchesTag = !normalizedTag || post.tags.some((postTag) => normalize(postTag) === normalizedTag);
      return matchesQuery && matchesCategory && matchesTag;
    });
  }, [category, posts, query, tag]);

  const visiblePosts = mode === "search" && !query.trim() ? [] : filteredPosts;
  const hasFilters = Boolean(query.trim() || category || tag);
  const resultLabel = mode === "search" && !query.trim() ? "Search the archive" : `${visiblePosts.length} ${visiblePosts.length === 1 ? "result" : "results"}`;

  return (
    <div className="article-explorer">
      <h2 className="sr-only">{mode === "search" ? "Search results" : "Articles"}</h2>
      <div className="explorer-toolbar">
        <form className="search-form explorer-search" onSubmit={handleSubmit} role="search">
          <Search className="search-icon" size={17} strokeWidth={1.8} aria-hidden="true" />
          <input value={query} onChange={(event) => handleQueryChange(event.target.value)} placeholder={mode === "search" ? "Search titles, tags, and article text..." : "Search the blog instantly..."} aria-label={mode === "search" ? "Search titles, tags, and article text" : "Search the blog"} />
          {query && <button className="search-clear" type="button" onClick={() => handleQueryChange("")} aria-label="Clear search"><X size={15} /></button>}
          <button type="submit" aria-label="Search"><Search size={16} /></button>
        </form>
        <span className="archive-count" aria-live="polite">{resultLabel}</span>
      </div>

      {categories.length > 0 && <div className="explorer-filters">
        <div className="filter-section-heading"><span className="eyebrow">Filter by category</span>{hasFilters && <button className="clear-filters" type="button" onClick={clearFilters}>Clear all</button>}</div>
        <div className="filter-row" aria-label="Filter by category">
          <button className={!category ? "filter-chip active" : "filter-chip"} type="button" onClick={() => { setCategory(""); updateUrl({ category: "" }); }}>All writing</button>
          {categories.map((item) => <button className={category === item.slug ? "filter-chip active" : "filter-chip"} type="button" onClick={() => handleCategoryChange(item.slug)} key={item.slug}>{item.shortName}</button>)}
        </div>
        <div className="filter-section-heading filter-section-heading--tags"><span className="eyebrow">Filter by tag</span>{tag && <span className="active-filter-label">Selected: {tag}</span>}</div>
        <div className="filter-row tag-filter-row" aria-label="Filter by tag">
          {tags.map((item) => <button className={tag === item ? "filter-chip tag-chip active" : "filter-chip tag-chip"} type="button" onClick={() => handleTagChange(item)} key={item}>#{item}</button>)}
        </div>
      </div>}

      {mode === "search" && !query.trim() ? <div className="empty-state"><h2>Start with a question or technology.</h2><p>Try “RAG”, “Python”, “architecture”, or “learning”. Results update as you type.</p></div> : visiblePosts.length > 0 ? <div className="post-grid">{visiblePosts.map((post) => <ArticleResultCard key={post.slug} post={post} />)}</div> : <div className="empty-state"><h2>No matching notes yet.</h2><p>Try a broader search term, another tag, or clear the active filters.</p></div>}
    </div>
  );
}

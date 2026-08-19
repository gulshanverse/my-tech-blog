"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Edit3, ExternalLink, Plus, Save, Search, Trash2, X } from "lucide-react";
import type { Project } from "@/lib/projects";
import type { TopicRecord } from "@/lib/topic-data";
import { validateProjectCollection, validateProjectInput, validateTopicCollection, validateTopicInput } from "@/lib/content-management";

export type ContentType = "blog" | "projects" | "topics";
type EditorMode = "new" | "edit";

export function ContentTypeNavigation({ active }: { active: ContentType }) {
  return <nav className="author-content-type-nav" aria-label="Author Studio content types">
    {([['blog', 'Blog', '/author'], ['projects', 'Projects', '/author?type=projects'], ['topics', 'Topics', '/author?type=topics']] as const).map(([type, label, href]) => <Link key={type} href={href} className={active === type ? "active" : ""} aria-current={active === type ? "page" : undefined}>{label}</Link>)}
  </nav>;
}

function splitLines(value: string) { return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean); }
function joinLines(value: string[]) { return value.join("\n"); }

const blankProject: Project = { slug: "", name: "", category: "", description: "", coverImage: "", status: "Prototype", stack: [], github: "", demo: "", problem: "", solution: "", architecture: [], features: [], lessons: "" };
const blankTopic: TopicRecord = { slug: "", name: "", shortName: "", description: "" };

function Message({ error, notice }: { error: string; notice: string }) { return <>{error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="author-notice" role="status"><Check size={15} aria-hidden="true" /> {notice}</p>}</>; }

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="author-empty" role="alert"><p>{message}</p><button type="button" className="author-quiet-button" onClick={onRetry}>Retry</button></div>;
}

export function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sha, setSha] = useState("");
  const [draft, setDraft] = useState<Project | null>(null);
  const [mode, setMode] = useState<EditorMode>("edit");
  const [editingSlug, setEditingSlug] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("nameAsc");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/author/projects", { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Unable to load projects.");
      setProjects(Array.isArray(body.projects) ? body.projects : []);
      setSha(body.shas?.projects || "");
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load projects.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => projects.filter((project) => {
    const haystack = `${project.name} ${project.slug} ${project.category} ${project.stack.join(" ")} ${project.status}`.toLowerCase();
    return (!search.trim() || haystack.includes(search.trim().toLowerCase())) && (status === "all" || project.status === status);
  }).sort((a, b) => sort === "nameDesc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)), [projects, search, sort, status]);

  function update(field: keyof Project, value: string | string[]) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
    setError("");
    setNotice("");
  }

  async function save() {
    if (!draft) return;
    const next = mode === "edit" && editingSlug ? projects.map((item) => item.slug === editingSlug ? draft : item) : [...projects, draft];
    const errors = validateProjectInput(draft).concat(validateProjectCollection(next).filter((item) => item.includes("unique")));
    if (errors.length) { setError(errors[0]); return; }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/author/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projects: next, sha }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Unable to save project.");
      const refreshed = await load();
      if (!refreshed) {
        setNotice("");
        throw new Error("Project saved, but the refreshed project list could not be loaded. Keep this form open and retry after refreshing.");
      }
      setDraft(null);
      setMode("edit");
      setEditingSlug("");
      setNotice(mode === "new" ? "Project created and saved to GitHub." : "Project saved to GitHub.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save project.");
    } finally {
      setBusy(false);
    }
  }

  function startNew() { setDraft({ ...blankProject }); setMode("new"); setEditingSlug(""); setError(""); setNotice(""); }
  function startEdit(project: Project) { setDraft({ ...project }); setMode("edit"); setEditingSlug(project.slug); setError(""); setNotice(""); }
  function cancel() { setDraft(null); setMode("edit"); setEditingSlug(""); setError(""); }

  return <section className="author-content-manager container"><div className="author-masthead"><div className="eyebrow">Content management</div><h1>Projects</h1><p>Manage the existing project records used by the public Projects pages.</p></div><div className="author-heading"><div><div className="eyebrow">Project archive</div><h2>Build in public.</h2><p>Projects remain backed by the repository’s existing `lib/projects.ts` schema.</p></div><button className="btn btn-primary" type="button" onClick={startNew}><Plus size={16} aria-hidden="true" /> New project</button></div><Message error={error && projects.length ? error : ""} notice={notice} /><div className="author-toolbar"><label className="author-search-field"><span className="sr-only">Search projects</span><Search size={15} aria-hidden="true" /><input aria-label="Search projects" placeholder="Search projects…" value={search} onChange={(event) => setSearch(event.target.value)} /></label><select aria-label="Filter projects by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{Array.from(new Set(projects.map((project) => project.status))).map((item) => <option value={item} key={item}>{item}</option>)}</select><select aria-label="Sort projects" value={sort} onChange={(event) => setSort(event.target.value)}><option value="nameAsc">Name A–Z</option><option value="nameDesc">Name Z–A</option></select></div>{busy && !projects.length ? <p>Loading projects…</p> : error && !projects.length ? <ErrorState message={error} onRetry={() => void load()} /> : <div className="author-article-list">{filtered.map((project) => <button type="button" className="author-article-row" key={project.slug} onClick={() => startEdit(project)}><span className="status-dot status-published" aria-hidden="true" /><span className="author-article-main"><strong>{project.name}</strong><span>{project.status} · {project.category} · {project.stack.slice(0, 3).join(", ")}</span></span><span className="author-row-arrow">Edit <Edit3 size={14} aria-hidden="true" /></span></button>)}{!filtered.length && !busy && <div className="author-empty"><p>No projects found.</p><p>Try another search or create a new project.</p></div>}</div>}{draft && <ProjectEditor mode={mode} draft={draft} busy={busy} onChange={update} onCancel={cancel} onSave={() => void save()} />}</section>;
}

function ProjectEditor({ mode, draft, busy, onChange, onCancel, onSave }: { mode: EditorMode; draft: Project; busy: boolean; onChange: (field: keyof Project, value: string | string[]) => void; onCancel: () => void; onSave: () => void }) {
  const isNew = mode === "new";
  return <div className="author-panel content-type-editor"><div className="author-editor-heading"><div><div className="eyebrow">{isNew ? "New project" : "Project editor"}</div><h2>{draft.name || "New project"}</h2></div><div className="author-editor-actions"><button type="button" className="author-quiet-button" onClick={onCancel}><X size={15} /> Cancel</button><button type="button" className="btn btn-primary" onClick={onSave} disabled={busy}><Save size={15} /> {isNew ? "Create project" : "Save project"}</button></div></div><div className="author-form author-fields content-type-form"><label>Project name<input value={draft.name} onChange={(event) => onChange("name", event.target.value)} required /></label><label>Slug<input value={draft.slug} onChange={(event) => onChange("slug", event.target.value)} placeholder="project-slug" required /></label><div className="author-field-grid"><label>Category<input value={draft.category} onChange={(event) => onChange("category", event.target.value)} /></label><label>Status<input value={draft.status} onChange={(event) => onChange("status", event.target.value)} /></label></div><label>Short description<textarea rows={3} value={draft.description} onChange={(event) => onChange("description", event.target.value)} required /></label><label>Cover image URL<input value={draft.coverImage} onChange={(event) => onChange("coverImage", event.target.value)} /></label><div className="author-field-grid"><label>GitHub URL<input type="url" value={draft.github || ""} onChange={(event) => onChange("github", event.target.value)} /></label><label>Live demo URL<input type="url" value={draft.demo || ""} onChange={(event) => onChange("demo", event.target.value)} /></label></div><label>Technology stack<textarea rows={3} value={joinLines(draft.stack)} onChange={(event) => onChange("stack", splitLines(event.target.value))} /><small>One technology per line.</small></label><label>Problem<textarea rows={3} value={draft.problem} onChange={(event) => onChange("problem", event.target.value)} /></label><label>Solution<textarea rows={3} value={draft.solution} onChange={(event) => onChange("solution", event.target.value)} /></label><label>Architecture<textarea rows={4} value={joinLines(draft.architecture)} onChange={(event) => onChange("architecture", splitLines(event.target.value))} /><small>One architecture note per line.</small></label><label>Features<textarea rows={4} value={joinLines(draft.features)} onChange={(event) => onChange("features", splitLines(event.target.value))} /><small>One feature per line.</small></label><label>Lessons<textarea rows={3} value={draft.lessons} onChange={(event) => onChange("lessons", event.target.value)} /></label><div className="content-type-preview-links"><Link href={`/projects/${draft.slug}`} target="_blank" rel="noreferrer" className="author-quiet-button"><ExternalLink size={14} /> Preview project</Link><button type="button" className="author-danger-button" onClick={onCancel}><Trash2 size={14} /> Cancel</button></div></div></div>;
}

export function TopicManager() {
  const [topics, setTopics] = useState<TopicRecord[]>([]);
  const [sha, setSha] = useState("");
  const [draft, setDraft] = useState<TopicRecord | null>(null);
  const [mode, setMode] = useState<EditorMode>("edit");
  const [editingSlug, setEditingSlug] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/author/topics", { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Unable to load topics.");
      setTopics(Array.isArray(body.topics) ? body.topics : []);
      setSha(body.shas?.topics || "");
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load topics.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => topics.filter((topic) => !search.trim() || `${topic.name} ${topic.slug} ${topic.shortName}`.toLowerCase().includes(search.trim().toLowerCase())), [topics, search]);

  function update(field: keyof TopicRecord, value: string) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
    setError("");
    setNotice("");
  }

  async function save() {
    if (!draft) return;
    const next = mode === "edit" && editingSlug ? topics.map((item) => item.slug === editingSlug ? draft : item) : [...topics, draft];
    const errors = validateTopicInput(draft).concat(validateTopicCollection(next).filter((item) => item.includes("unique")));
    if (errors.length) { setError(errors[0]); return; }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/author/topics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topics: next, sha }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Unable to save topic.");
      const refreshed = await load();
      if (!refreshed) {
        setNotice("");
        throw new Error("Topic saved, but the refreshed topic list could not be loaded. Keep this form open and retry after refreshing.");
      }
      setDraft(null);
      setMode("edit");
      setEditingSlug("");
      setNotice(mode === "new" ? "Topic created and saved to GitHub." : "Topic saved to GitHub.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save topic.");
    } finally {
      setBusy(false);
    }
  }

  function startNew() { setDraft({ ...blankTopic }); setMode("new"); setEditingSlug(""); setError(""); setNotice(""); }
  function startEdit(topic: TopicRecord) { setDraft({ ...topic }); setMode("edit"); setEditingSlug(topic.slug); setError(""); setNotice(""); }
  function cancel() { setDraft(null); setMode("edit"); setEditingSlug(""); setError(""); }

  return <section className="author-content-manager container"><div className="author-masthead"><div className="eyebrow">Content management</div><h1>Topics</h1><p>Manage the existing category metadata used by public topic pages and article taxonomy.</p></div><div className="author-heading"><div><div className="eyebrow">Topic index</div><h2>Follow the threads.</h2><p>Articles currently relate to topics through their existing category frontmatter; project relationships remain schema-derived.</p></div><button className="btn btn-primary" type="button" onClick={startNew}><Plus size={16} aria-hidden="true" /> New topic</button></div><Message error={error && topics.length ? error : ""} notice={notice} /><div className="author-toolbar"><label className="author-search-field"><span className="sr-only">Search topics</span><Search size={15} aria-hidden="true" /><input aria-label="Search topics" placeholder="Search topics…" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>{busy && !topics.length ? <p>Loading topics…</p> : error && !topics.length ? <ErrorState message={error} onRetry={() => void load()} /> : <div className="author-article-list">{filtered.map((topic) => <button type="button" className="author-article-row" key={topic.slug} onClick={() => startEdit(topic)}><span className="status-dot status-published" aria-hidden="true" /><span className="author-article-main"><strong>{topic.name}</strong><span>{topic.shortName} · /topics/{topic.slug}</span></span><span className="author-row-arrow">Edit <Edit3 size={14} aria-hidden="true" /></span></button>)}{!filtered.length && !busy && <div className="author-empty"><p>No topics found.</p><p>Try another search or create a new topic.</p></div>}</div>}{draft && <div className="author-panel content-type-editor"><div className="author-editor-heading"><div><div className="eyebrow">{mode === "new" ? "New topic" : "Topic editor"}</div><h2>{draft.name || "New topic"}</h2></div><div className="author-editor-actions"><button type="button" className="author-quiet-button" onClick={cancel}><X size={15} /> Cancel</button><button type="button" className="btn btn-primary" onClick={() => void save()} disabled={busy}><Save size={15} /> {mode === "new" ? "Create topic" : "Save topic"}</button></div></div><div className="author-form author-fields content-type-form"><label>Topic name<input value={draft.name} onChange={(event) => update("name", event.target.value)} required /></label><label>Slug<input value={draft.slug} onChange={(event) => update("slug", event.target.value)} disabled={mode === "edit"} placeholder="topic-slug" required /><small>{mode === "edit" ? "Existing topic slugs are identity keys for article categories and cannot be changed in place." : "Use lowercase letters, numbers, and hyphens. This slug becomes the public topic URL."}</small></label><label>Short name<input value={draft.shortName} onChange={(event) => update("shortName", event.target.value)} required /></label><label>Description<textarea rows={4} value={draft.description} onChange={(event) => update("description", event.target.value)} required /></label><div className="content-type-preview-links"><Link href={`/topics/${draft.slug}`} target="_blank" rel="noreferrer" className="author-quiet-button"><ExternalLink size={14} /> Preview topic</Link><button type="button" className="author-danger-button" onClick={cancel}><Trash2 size={14} /> Cancel</button></div></div></div>}</section>;
}

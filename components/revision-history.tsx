"use client";

import { useMemo, useState } from "react";
import type { ArticleDraftInput } from "@/lib/author-articles";

type Revision = { sha: string; message: string; author: string; timestamp: string };
type Props = { path: string; currentInput: ArticleDraftInput; onRestored: (input: ArticleDraftInput, path: string, sha: string) => void };

function formatRevisionDate(value: string) {
  if (!value) return "Unknown time";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function diffLines(current: string, selected: string) {
  const currentLines = new Set(current.split("\n"));
  const selectedLines = new Set(selected.split("\n"));
  return selected.split("\n").map((line, index) => ({ key: `${index}-${line}`, line, kind: currentLines.has(line) ? "context" : "added" })).concat(current.split("\n").filter((line) => !selectedLines.has(line)).map((line, index) => ({ key: `removed-${index}-${line}`, line, kind: "removed" })));
}

export function RevisionHistory({ path, currentInput, onRestored }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [selected, setSelected] = useState<Revision | null>(null);
  const [selectedInput, setSelectedInput] = useState<ArticleDraftInput | null>(null);
  const [error, setError] = useState("");
  const diff = useMemo(() => selectedInput ? diffLines(currentInput.content, selectedInput.content) : [], [currentInput.content, selectedInput]);

  async function loadHistory() {
    setOpen(true); if (revisions.length || busy) return; setBusy(true); setError("");
    const response = await fetch(`/api/author/articles?path=${encodeURIComponent(path)}&history=1`, { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error || "Unable to load revision history."); else setRevisions(body.revisions || []);
    setBusy(false);
  }

  async function inspectRevision(revision: Revision) {
    setBusy(true); setError("");
    const response = await fetch(`/api/author/articles?path=${encodeURIComponent(path)}&revision=${revision.sha}`, { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error || "Unable to inspect this revision."); else { setSelected(revision); setSelectedInput(body.input); }
    setBusy(false);
  }

  async function restoreRevision() {
    if (!selected || !window.confirm("Restore this revision? The current version will be replaced by a new GitHub commit, preserving the current version in history.")) return;
    setBusy(true); setError("");
    let response = await fetch("/api/author/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "restore", path, revisionSha: selected.sha }) });
    let body = await response.json().catch(() => ({}));
    if (response.status === 409 && body.requiresConfirmation && window.confirm("This article is published. Restore the revision while preserving its published status?")) {
      response = await fetch("/api/author/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "restore", path, revisionSha: selected.sha, confirmed: true }) });
      body = await response.json().catch(() => ({}));
    }
    if (!response.ok) setError(body.error || "Unable to restore this revision."); else if (body.input) { onRestored(body.input, body.path, body.sha); setError(""); }
    setBusy(false);
  }

  return <div className="author-panel revision-history"><div className="eyebrow">Revision history</div><h2>Previous saves</h2><button className="author-quiet-button" type="button" onClick={loadHistory} aria-expanded={open}>{open ? "Refresh history" : "Open revision history"}</button>{open && <div className="revision-history-body">{busy && !revisions.length ? <p className="author-muted">Loading GitHub history…</p> : revisions.length ? <div className="revision-list">{revisions.map((revision) => <button className={`revision-item ${selected?.sha === revision.sha ? "active" : ""}`} key={revision.sha} type="button" onClick={() => void inspectRevision(revision)}><strong>{formatRevisionDate(revision.timestamp)}</strong><span>{revision.message}</span><small>{revision.author} · {revision.sha.slice(0, 7)}</small></button>)}</div> : <p className="author-muted">No saved revisions were found.</p>}{selected && selectedInput && <div className="revision-comparison"><div className="revision-comparison-heading"><div><span className="eyebrow">Selected revision</span><strong>{selectedInput.title}</strong></div><button className="author-danger-button" type="button" onClick={() => void restoreRevision()} disabled={busy}>Restore this revision</button></div><p className="author-muted">Current version vs. {formatRevisionDate(selected.timestamp)}. Added lines are highlighted in gold; removed lines are marked in red.</p><pre aria-label="Revision textual diff">{diff.map((item) => <code className={`revision-line revision-${item.kind}`} key={item.key}>{item.kind === "added" ? "+ " : item.kind === "removed" ? "− " : "  "}{item.line}{"\n"}</code>)}</pre></div>}{error && <p className="form-error" role="alert">{error}</p>}</div>}</div>;
}

"use client";

import { useState } from "react";

export function CodeCopyButton() {
  const [copied, setCopied] = useState(false);
  async function copy() { const shell = document.activeElement?.closest(".code-shell") || document.querySelector(".code-shell:hover"); const code = shell?.querySelector("pre")?.textContent || ""; try { await navigator.clipboard.writeText(code); setCopied(true); window.setTimeout(() => setCopied(false), 1400); } catch { setCopied(false); } }
  return <button className="code-copy" type="button" onClick={copy}>{copied ? "Copied" : "Copy"}</button>;
}

"use client";

import { Check, Copy, List, Maximize2, Minimize2 } from "lucide-react";
import { isValidElement, useId, useState, type ComponentPropsWithoutRef, type MouseEvent, type ReactNode } from "react";

function detectLanguage(children: ReactNode) {
  const firstChild = Array.isArray(children) ? children.find(Boolean) : children;
  if (!isValidElement(firstChild)) return "code";
  const props = firstChild.props as { className?: string; [key: string]: unknown };
  const dataLanguage = props["data-language"];
  if (typeof dataLanguage === "string" && dataLanguage) return dataLanguage;
  const match = props.className?.match(/language-([\w-]+)/);
  return match?.[1] || "code";
}

function formatLanguage(language: string) {
  const labels: Record<string, string> = { ts: "TypeScript", tsx: "TSX", js: "JavaScript", jsx: "JSX", py: "Python", md: "Markdown", text: "Text", sh: "Shell" };
  return labels[language] || language.charAt(0).toUpperCase() + language.slice(1);
}

type CodeBlockProps = ComponentPropsWithoutRef<"pre"> & { children?: ReactNode };

export function CodeBlock({ children, ...props }: CodeBlockProps) {
  const language = detectLanguage(children);
  const codeId = `code-${useId().replace(/:/g, "")}`;
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function copyCode(event: MouseEvent<HTMLButtonElement>) {
    const shell = event.currentTarget.closest<HTMLElement>(".code-shell");
    const renderedCode = shell?.querySelector("pre")?.textContent || (Array.isArray(children) ? children.map(String).join("") : String(children || ""));
    try {
      await navigator.clipboard.writeText(renderedCode.trim());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={`code-shell${expanded ? " code-shell--expanded" : ""}`}>
      <div className="code-bar">
        <span className="code-language"><span className="code-language-dot" aria-hidden="true" />{formatLanguage(language)}</span>
        <div className="code-actions">
          <button className={`code-control${showLineNumbers ? " code-control--active" : ""}`} type="button" aria-label={`${showLineNumbers ? "Hide" : "Show"} Lines`} aria-pressed={showLineNumbers} onClick={() => setShowLineNumbers((value) => !value)}><List size={13} aria-hidden="true" /> Lines</button>
          <button className="code-control" type="button" aria-label={expanded ? "Collapse code block" : "Expand code block"} aria-expanded={expanded} aria-controls={codeId} onClick={() => setExpanded((value) => !value)}>{expanded ? <Minimize2 size={13} aria-hidden="true" /> : <Maximize2 size={13} aria-hidden="true" />}{expanded ? "Collapse" : "Expand"}</button>
          <button className="code-control code-control--copy" type="button" aria-label={copied ? "Code copied" : "Copy code"} onClick={copyCode}>{copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}{copied ? "Copied" : "Copy"}</button>
        </div>
      </div>
      <pre {...props} id={codeId} data-line-numbers={showLineNumbers ? "true" : "false"} data-code-language={language}>{children}</pre>
    </div>
  );
}

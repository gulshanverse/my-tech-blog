"use client";

import { Check, Copy, List, Maximize2, Minimize2 } from "lucide-react";
import { isValidElement, useState, type ComponentPropsWithoutRef, type MouseEvent, type ReactNode } from "react";

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
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function copyCode(event: MouseEvent<HTMLButtonElement>) {
    const shell = event.currentTarget.closest(".code-shell");
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
          <button className={`code-control${showLineNumbers ? " code-control--active" : ""}`} type="button" aria-pressed={showLineNumbers} onClick={() => setShowLineNumbers((value) => !value)}><List size={13} /> Lines</button>
          <button className="code-control" type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}{expanded ? "Collapse" : "Expand"}</button>
          <button className="code-control code-control--copy" type="button" onClick={copyCode}>{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "Copied" : "Copy"}</button>
        </div>
      </div>
      <pre {...props} data-line-numbers={showLineNumbers ? "true" : "false"} data-code-language={language}>{children}</pre>
    </div>
  );
}

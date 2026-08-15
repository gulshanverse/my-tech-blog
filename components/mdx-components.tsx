import type { MDXComponents } from "mdx/types";
import { CodeCopyButton } from "./code-copy-button";

export const mdxComponents: MDXComponents = {
  pre: ({ children, ...props }) => <div className="code-shell"><div className="code-bar"><span>code</span><CodeCopyButton /></div><pre {...props}>{children}</pre></div>,
  blockquote: ({ children }) => <blockquote className="callout"><strong>Note</strong>{children}</blockquote>,
};

import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "./code-block";

export const mdxComponents: MDXComponents = {
  pre: ({ children, ...props }) => <CodeBlock {...props}>{children}</CodeBlock>,
  blockquote: ({ children }) => <blockquote className="callout"><strong>Note</strong>{children}</blockquote>,
};

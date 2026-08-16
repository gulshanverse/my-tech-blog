import type { MDXComponents } from "mdx/types";
import { Callout, InfoCallout, Note, Tip, Warning } from "./mdx-callouts";
import { CodeBlock } from "./code-block";
import { KeyTakeaways } from "./mdx-article";

export const mdxComponents: MDXComponents = {
  pre: ({ children, ...props }) => <CodeBlock {...props}>{children}</CodeBlock>,
  blockquote: ({ children }) => <Callout variant="note">{children}</Callout>,
  Note,
  Tip,
  Warning,
  Info: InfoCallout,
  KeyTakeaways,
};

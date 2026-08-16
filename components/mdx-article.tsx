import type { ReactNode } from "react";

export function KeyTakeaways({ children }: { children: ReactNode }) {
  return <aside className="key-takeaways" aria-label="Key takeaways"><div className="key-takeaways-label">Key takeaways</div><div className="key-takeaways-content">{children}</div></aside>;
}

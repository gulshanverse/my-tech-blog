import { AlertTriangle, Info, Lightbulb, StickyNote } from "lucide-react";
import type { ReactNode } from "react";

type CalloutVariant = "note" | "tip" | "warning" | "info";

const calloutMeta: Record<CalloutVariant, { label: string; Icon: typeof Info }> = {
  note: { label: "Note", Icon: StickyNote },
  tip: { label: "Tip", Icon: Lightbulb },
  warning: { label: "Warning", Icon: AlertTriangle },
  info: { label: "Info", Icon: Info },
};

export function Callout({ variant = "note", children }: { variant?: CalloutVariant; children: ReactNode }) {
  const { label, Icon } = calloutMeta[variant];
  return <aside className={`mdx-callout mdx-callout--${variant}`} role="note" aria-label={label}><div className="mdx-callout-heading"><Icon size={16} strokeWidth={1.9} aria-hidden="true" /><strong>{label}</strong></div><div className="mdx-callout-content">{children}</div></aside>;
}

export function Note({ children }: { children: ReactNode }) { return <Callout variant="note">{children}</Callout>; }
export function Tip({ children }: { children: ReactNode }) { return <Callout variant="tip">{children}</Callout>; }
export function Warning({ children }: { children: ReactNode }) { return <Callout variant="warning">{children}</Callout>; }
export function InfoCallout({ children }: { children: ReactNode }) { return <Callout variant="info">{children}</Callout>; }

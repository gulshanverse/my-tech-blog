"use client";

import { useEffect, useState } from "react";

type Reaction = "helpful" | "loved" | "learned";

const reactions: Array<{ id: Reaction; label: string; emoji: string }> = [
  { id: "helpful", label: "Helpful", emoji: "👍" },
  { id: "loved", label: "Loved it", emoji: "❤️" },
  { id: "learned", label: "Learned something", emoji: "💡" },
];

const storageKey = (slug: string) => `article-feedback:${slug}`;

export function FeedbackReactions({ slug }: { slug: string }) {
  const [selected, setSelected] = useState<Reaction | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey(slug));
      if (saved === "helpful" || saved === "loved" || saved === "learned") setSelected(saved);
    } catch {
      // Feedback remains usable for this session when browser storage is unavailable.
    } finally {
      setMounted(true);
    }
  }, [slug]);

  function chooseReaction(reaction: Reaction) {
    if (selected === reaction) return;
    setSelected(reaction);
    try {
      window.localStorage.setItem(storageKey(slug), reaction);
    } catch {
      // Do not block the article when persistence is unavailable.
    }
  }

  return <section className="feedback-reactions" aria-labelledby="feedback-heading"><div><div className="eyebrow">Reader feedback</div><h2 id="feedback-heading">Was this article useful?</h2></div><div className="feedback-options" role="group" aria-label="Article feedback options">{reactions.map((reaction) => <button className={selected === reaction.id ? "feedback-option feedback-option--selected" : "feedback-option"} type="button" key={reaction.id} aria-pressed={selected === reaction.id} aria-label={`${reaction.emoji} ${reaction.label}${selected === reaction.id ? ", selected" : ""}`} disabled={!mounted} onClick={() => chooseReaction(reaction.id)}><span aria-hidden="true">{reaction.emoji}</span><span>{reaction.label}</span>{selected === reaction.id && <span className="feedback-check" aria-hidden="true">✓</span>}</button>)}</div><p className={selected ? "feedback-confirmation feedback-confirmation--visible" : "feedback-confirmation"} aria-live="polite">{selected ? "Thanks for the feedback!" : ""}</p></section>;
}

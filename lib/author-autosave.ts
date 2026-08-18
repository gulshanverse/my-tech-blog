import type { ArticleDraftInput } from "@/lib/article-draft";

export const AUTO_SAVE_DELAY_MS = 900;

export function canAutoSaveDraft(input: ArticleDraftInput) {
  return input.status === "draft" && Boolean(input.title.trim() && input.slug.trim() && input.description.trim() && input.tags.trim() && input.readingTime.trim() && input.content.trim());
}

export function scheduleAutoSave(callback: () => void, delay = AUTO_SAVE_DELAY_MS) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    schedule() { if (timer) clearTimeout(timer); timer = setTimeout(callback, delay); },
    cancel() { if (timer) clearTimeout(timer); timer = undefined; },
  };
}

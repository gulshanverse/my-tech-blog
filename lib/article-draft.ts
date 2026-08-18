import { categoryMeta, type CategorySlug } from "@/lib/site";
import { normalizeDifficulty, parseReadingTime, type Difficulty } from "@/lib/article-metadata";

export type ArticleDraftInput = {
  title: string;
  slug: string;
  category: CategorySlug;
  tags: string;
  description: string;
  coverImage: string;
  coverAlt: string;
  readingTime: string;
  difficulty: Difficulty | "";
  status: "draft" | "published";
  content: string;
  date: string;
  updatedAt: string;
  featured: boolean;
  invalidDifficulty?: string;
};

export type DraftInputLike = Omit<Partial<ArticleDraftInput>, "tags" | "readingTime" | "difficulty"> & { tags?: unknown; readingTime?: unknown; difficulty?: unknown; [key: string]: unknown };

const categories = Object.keys(categoryMeta) as CategorySlug[];

function safeString(value: unknown) { return value === null || value === undefined ? "" : String(value); }
function tagsToInput(tags: unknown) { return Array.isArray(tags) ? tags.map(safeString).join(", ") : safeString(tags); }

export function todayIso() { return new Date().toISOString().slice(0, 10); }

export function emptyDraftInput(): ArticleDraftInput {
  return { title: "", slug: "", category: "ai", tags: "", description: "", coverImage: "", coverAlt: "", readingTime: "1", difficulty: "", status: "draft", content: "", date: todayIso(), updatedAt: "", featured: false };
}

export function normalizeDraftInput(input: DraftInputLike): ArticleDraftInput {
  const defaults = emptyDraftInput();
  const category = categories.includes(input.category as CategorySlug) ? input.category as CategorySlug : defaults.category;
  const parsedReadingTime = parseReadingTime(input.readingTime);
  const normalizedDifficulty = normalizeDifficulty(input.difficulty);
  const rawDifficulty = safeString(input.difficulty).trim();
  return { ...defaults, title: safeString(input.title).trim(), slug: safeString(input.slug).trim().toLowerCase(), category, tags: tagsToInput(input.tags), description: safeString(input.description).trim(), coverImage: safeString(input.coverImage).trim(), coverAlt: safeString(input.coverAlt).trim(), readingTime: String(parsedReadingTime || defaults.readingTime), difficulty: normalizedDifficulty || "", invalidDifficulty: rawDifficulty && !normalizedDifficulty ? rawDifficulty : undefined, status: input.status === "published" ? "published" : "draft", content: safeString(input.content), date: safeString(input.date) || defaults.date, updatedAt: safeString(input.updatedAt), featured: input.featured === true };
}

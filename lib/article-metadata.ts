export const DIFFICULTY_OPTIONS = ["Beginner", "Intermediate", "Advanced"] as const;
export type Difficulty = (typeof DIFFICULTY_OPTIONS)[number];

export const ARTICLE_COVER_WIDTH = 2400;
export const ARTICLE_COVER_HEIGHT = 1350;
export const ARTICLE_COVER_ASPECT_RATIO = 16 / 9;
export const ARTICLE_COVER_RATIO_LABEL = "16:9";
export const ARTICLE_COVER_DIMENSIONS_LABEL = `${ARTICLE_COVER_WIDTH} × ${ARTICLE_COVER_HEIGHT} px`;
export const MAX_COVER_IMAGE_BYTES = 5 * 1024 * 1024;

export function parseReadingTime(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isInteger(value) && value >= 1 ? value : undefined;
  if (typeof value !== "string") return undefined;
  const match = /^\s*(\d+)\s*(?:min(?:ute)?s?\s*read|min(?:ute)?s?)?\s*$/i.exec(value);
  if (!match) return undefined;
  const minutes = Number(match[1]);
  return Number.isInteger(minutes) && minutes >= 1 ? minutes : undefined;
}

export function formatReadingTime(value: unknown): string {
  const minutes = parseReadingTime(value);
  return minutes ? `${minutes} min read` : "";
}

export function normalizeDifficulty(value: unknown): Difficulty | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "beginner") return "Beginner";
  if (normalized === "intermediate" || normalized === "medium") return "Intermediate";
  if (normalized === "advanced") return "Advanced";
  return undefined;
}

export function isRecommendedCoverRatio(width: number, height: number, tolerance = 0.03) {
  if (!width || !height) return false;
  return Math.abs(width / height - ARTICLE_COVER_ASPECT_RATIO) <= tolerance;
}

export function coverRatioLabel(width: number, height: number) {
  if (!width || !height) return "Ratio unavailable";
  return `${(width / height).toFixed(2)}:1`;
}

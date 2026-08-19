import type { Project } from "@/lib/projects";
import type { CategorySlug } from "@/lib/site";

export type ManagedContentType = "projects" | "topics";

export type TopicRecord = {
  slug: CategorySlug;
  name: string;
  shortName: string;
  description: string;
};

export type ProjectInput = Project;
export type TopicInput = TopicRecord;

export function validateProjectInput(input: Partial<ProjectInput>) {
  const errors: string[] = [];
  if (!String(input.name || "").trim()) errors.push("Project name is required.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(input.slug || ""))) errors.push("Project slug must use lowercase letters, numbers, and hyphens.");
  if (!String(input.description || "").trim()) errors.push("Project description is required.");
  return errors;
}

export function validateTopicInput(input: Partial<TopicInput>) {
  const errors: string[] = [];
  if (!String(input.name || "").trim()) errors.push("Topic name is required.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(input.slug || ""))) errors.push("Topic slug must use lowercase letters, numbers, and hyphens.");
  if (!String(input.description || "").trim()) errors.push("Topic description is required.");
  if (!String(input.shortName || "").trim()) errors.push("Topic short name is required.");
  return errors;
}

export function serializeProjects(records: Project[]) {
  return `export type Project = {\n  slug: string;\n  name: string;\n  category: string;\n  description: string;\n  coverImage: string;\n  status: string;\n  stack: string[];\n  github?: string;\n  demo?: string;\n  problem: string;\n  solution: string;\n  architecture: string[];\n  features: string[];\n  lessons: string;\n};\n\nexport const projects: Project[] = ${JSON.stringify(records, null, 2)};\n\nexport function getProject(slug: string) {\n  return projects.find((project) => project.slug === slug);\n}\n`;
}

export function serializeTopics(records: TopicRecord[]) {
  const object = Object.fromEntries(records.map((topic) => [topic.slug, topic]));
  return `export type TopicRecord = {\n  slug: string;\n  name: string;\n  shortName: string;\n  description: string;\n};\n\nexport const topicMeta: Record<string, TopicRecord> = ${JSON.stringify(object, null, 2)};\n\nexport const topics = Object.values(topicMeta);\n`;
}

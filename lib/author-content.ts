import "server-only";

import { getGithubFile, githubContentConfigured, writeGithubFile } from "@/lib/github-content";
import { projects, type Project } from "@/lib/projects";
import { topicMeta } from "@/lib/topic-data";
import { serializeProjects, serializeTopics, type TopicInput, validateProjectCollection, validateTopicCollection } from "@/lib/content-management";

export const PROJECTS_SOURCE_PATH = "lib/projects.ts";
export const TOPICS_SOURCE_PATH = "lib/topic-data.ts";

export function getLocalProjects() { return projects; }
export function getLocalTopics(): TopicInput[] { return Object.values(topicMeta); }

export function parseSerializedProjects(content: string): Project[] {
  const start = content.indexOf("export const projects: Project[] = ");
  const end = content.indexOf(";\n\nexport function getProject", start);
  if (start < 0 || end < 0) throw new Error("Projects source has an invalid serialized shape.");
  const json = content.slice(start + "export const projects: Project[] = ".length, end);
  const records = JSON.parse(json) as unknown;
  if (!Array.isArray(records)) throw new Error("Projects source did not contain an array.");
  return records as Project[];
}

export function parseSerializedTopics(content: string): TopicInput[] {
  const start = content.indexOf("export const topicMeta: Record<string, TopicRecord> = ");
  const end = content.indexOf(";\n\nexport const topics", start);
  if (start < 0 || end < 0) throw new Error("Topics source has an invalid serialized shape.");
  const json = content.slice(start + "export const topicMeta: Record<string, TopicRecord> = ".length, end);
  const records = JSON.parse(json) as unknown;
  if (!records || typeof records !== "object" || Array.isArray(records)) throw new Error("Topics source did not contain a record map.");
  return Object.values(records as Record<string, TopicInput>);
}

export async function getAuthorProjects() {
  if (!githubContentConfigured()) return { projects: getLocalProjects(), sha: "" };
  const file = await getGithubFile(PROJECTS_SOURCE_PATH);
  if (!file) throw new Error(`Source file ${PROJECTS_SOURCE_PATH} was not found.`);
  return { projects: parseSerializedProjects(file.content), sha: file.sha };
}

export async function getAuthorTopics() {
  if (!githubContentConfigured()) return { topics: getLocalTopics(), sha: "" };
  const file = await getGithubFile(TOPICS_SOURCE_PATH);
  if (!file) throw new Error(`Source file ${TOPICS_SOURCE_PATH} was not found.`);
  return { topics: parseSerializedTopics(file.content), sha: file.sha };
}

async function sourceSha(path: string) {
  const file = await getGithubFile(path);
  if (!file) throw new Error(`Source file ${path} was not found.`);
  return file.sha;
}

export async function saveProjects(next: Project[], expectedSha?: string) {
  const errors = validateProjectCollection(next);
  if (errors.length) throw new Error(errors[0]);
  if (!expectedSha) throw new Error("Projects source SHA is required. Reload before saving again.");
  if (!githubContentConfigured()) throw new Error("GitHub publishing is not configured on the server.");
  const sha = await sourceSha(PROJECTS_SOURCE_PATH);
  if (expectedSha !== sha) throw new Error("Projects changed in GitHub. Reload before saving again.");
  return writeGithubFile(PROJECTS_SOURCE_PATH, serializeProjects(next), "chore: update Author Studio projects", sha);
}

export async function saveTopics(next: TopicInput[], expectedSha?: string) {
  const errors = validateTopicCollection(next);
  if (errors.length) throw new Error(errors[0]);
  if (!expectedSha) throw new Error("Topics source SHA is required. Reload before saving again.");
  if (!githubContentConfigured()) throw new Error("GitHub publishing is not configured on the server.");
  const sha = await sourceSha(TOPICS_SOURCE_PATH);
  if (expectedSha !== sha) throw new Error("Topics changed in GitHub. Reload before saving again.");
  return writeGithubFile(TOPICS_SOURCE_PATH, serializeTopics(next), "chore: update Author Studio topics", sha);
}

export async function getSourceShas() {
  if (!githubContentConfigured()) return { projects: "", topics: "" };
  const [projectsFile, topicsFile] = await Promise.all([getGithubFile(PROJECTS_SOURCE_PATH), getGithubFile(TOPICS_SOURCE_PATH)]);
  return { projects: projectsFile?.sha || "", topics: topicsFile?.sha || "" };
}

import "server-only";

import { getGithubFile, githubContentConfigured, writeGithubFile } from "@/lib/github-content";
import { projects, type Project } from "@/lib/projects";
import { topicMeta } from "@/lib/topic-data";
import { serializeProjects, serializeTopics, type TopicInput, validateProjectCollection, validateTopicCollection } from "@/lib/content-management";

export const PROJECTS_SOURCE_PATH = "lib/projects.ts";
export const TOPICS_SOURCE_PATH = "lib/topic-data.ts";

export function getLocalProjects() { return projects; }
export function getLocalTopics(): TopicInput[] { return Object.values(topicMeta); }

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

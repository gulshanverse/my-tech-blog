import { describe, expect, it } from "vitest";
import { serializeProjects, serializeTopics, validateProjectInput, validateTopicInput } from "@/lib/content-management";

describe("content management schemas", () => {
  it("validates the existing project schema without inventing required fields", () => {
    expect(validateProjectInput({ name: "Signalboard", slug: "signalboard", description: "A project" })).toEqual([]);
    expect(validateProjectInput({ name: "", slug: "Bad Slug", description: "" })).toEqual([
      "Project name is required.",
      "Project slug must use lowercase letters, numbers, and hyphens.",
      "Project description is required.",
    ]);
  });

  it("validates topic identity and preserves the existing four-field metadata shape", () => {
    expect(validateTopicInput({ name: "AI", slug: "ai", shortName: "AI", description: "Systems" })).toEqual([]);
    expect(validateTopicInput({ name: "AI", slug: "ai topic", shortName: "", description: "" })).toHaveLength(3);
  });

  it("serializes project and topic records as the existing source modules", () => {
    const projects = [{ slug: "demo", name: "Demo", category: "Experiment", description: "D", coverImage: "/demo.png", status: "Prototype", stack: ["TypeScript"], github: "", demo: "", problem: "P", solution: "S", architecture: ["A"], features: ["F"], lessons: "L" }];
    const topics = [{ slug: "demo", name: "Demo", shortName: "D", description: "Topic" }];
    expect(serializeProjects(projects)).toContain("export const projects: Project[]");
    expect(serializeProjects(projects)).toContain('"name": "Demo"');
    expect(serializeTopics(topics)).toContain("export const topicMeta");
    expect(serializeTopics(topics)).toContain('"slug": "demo"');
  });
});

import { describe, expect, it } from "vitest";
import { getLocalProjects, getLocalTopics, parseSerializedProjects, parseSerializedTopics } from "@/lib/author-content";
import { serializeProjects, serializeTopics } from "@/lib/content-management";

describe("author content source parsing", () => {
  it("round-trips serialized projects from the GitHub source shape", () => {
    const source = serializeProjects(getLocalProjects());
    expect(parseSerializedProjects(source)).toEqual(getLocalProjects());
  });

  it("round-trips serialized topics from the GitHub source shape", () => {
    const source = serializeTopics(getLocalTopics());
    expect(parseSerializedTopics(source)).toEqual(getLocalTopics());
  });

  it("rejects malformed project source shapes", () => {
    expect(() => parseSerializedProjects("export const projects: Project[] = [];"))
      .toThrow(/invalid serialized shape/i);
  });

  it("rejects malformed topic source shapes", () => {
    expect(() => parseSerializedTopics("export const topicMeta: Record<string, TopicRecord> = {};"))
      .toThrow(/invalid serialized shape/i);
  });
});

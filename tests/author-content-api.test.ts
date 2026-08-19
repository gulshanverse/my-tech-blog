import { describe, expect, it, vi } from "vitest";

let projectSource = "";
let topicSource = "";

vi.mock("@/lib/author-auth", () => ({ hasAuthorSession: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/github-content", () => ({
  githubContentConfigured: () => true,
  getGithubFile: vi.fn(async (path: string) => path === "lib/projects.ts"
    ? { path, sha: "fresh-project-sha", content: projectSource }
    : { path, sha: "fresh-topic-sha", content: topicSource }),
  writeGithubFile: vi.fn(),
}));

describe("fresh Author Studio content reads", async () => {
  const [{ projects }, { topicMeta }, { serializeProjects, serializeTopics }, projectsRoute, topicsRoute] = await Promise.all([
    import("@/lib/projects"),
    import("@/lib/topic-data"),
    import("@/lib/content-management"),
    import("@/app/api/author/projects/route"),
    import("@/app/api/author/topics/route"),
  ]);

  const freshProject = { ...projects[0], slug: "fresh-api-project", name: "Fresh API Project" };
  const freshTopic = { ...Object.values(topicMeta)[0], slug: "fresh-api-topic", name: "Fresh API Topic" };
  projectSource = serializeProjects([...projects, freshProject]);
  topicSource = serializeTopics([...Object.values(topicMeta), freshTopic]);

  it("returns the freshly committed Project record and source SHA", async () => {
    const response = await projectsRoute.GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      shas: { projects: "fresh-project-sha" },
      projects: expect.arrayContaining([expect.objectContaining({ slug: "fresh-api-project", name: "Fresh API Project" })]),
    });
  });

  it("returns the freshly committed Topic record and source SHA", async () => {
    const response = await topicsRoute.GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      shas: { topics: "fresh-topic-sha" },
      topics: expect.arrayContaining([expect.objectContaining({ slug: "fresh-api-topic", name: "Fresh API Topic" })]),
    });
  });
});

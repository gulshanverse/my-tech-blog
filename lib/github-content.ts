import "server-only";

const repo = process.env.GITHUB_REPOSITORY || "gulshanverse/my-tech-blog";
const branch = process.env.GITHUB_BRANCH || "main";
const token = process.env.GITHUB_TOKEN || process.env.GITHUB_APP_TOKEN || "";
const apiBase = "https://api.github.com";

type GithubContentFile = { path: string; sha: string; content: string };

type GithubResponse = { message?: string; content?: { path: string; sha: string }; sha?: string; tree?: Array<{ path?: string; type?: string }> };

export function githubContentConfigured() {
  return Boolean(token);
}

function headers() {
  return { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" };
}

async function githubRequest<T extends GithubResponse>(path: string, init: RequestInit = {}) {
  if (!githubContentConfigured()) throw new Error("GitHub publishing is not configured on the server.");
  const response = await fetch(`${apiBase}${path}`, { ...init, headers: { ...headers(), ...(init.headers || {}) }, cache: "no-store" });
  const body = await response.json() as T;
  if (!response.ok) throw new Error(body.message || `GitHub request failed with status ${response.status}.`);
  return body;
}

export async function getGithubFile(path: string): Promise<GithubContentFile | null> {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  try {
    const body = await githubRequest<GithubResponse & { content?: string; encoding?: string; sha?: string }>(`/repos/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`);
    if (!body.content || !body.sha) return null;
    return { path, sha: body.sha, content: Buffer.from(body.content.replace(/\n/g, ""), "base64").toString("utf8") };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Not Found")) return null;
    throw error;
  }
}

export async function listGithubArticlePaths() {
  const body = await githubRequest<GithubResponse>(`/repos/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  return (body.tree || []).flatMap((item) => item.path && item.type === "blob" && item.path.startsWith("content/blog/") && item.path.endsWith(".mdx") ? [item.path] : []);
}

export async function writeGithubFile(path: string, content: string, message: string, sha?: string) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const body = await githubRequest<GithubResponse>(`/repos/${repo}/contents/${encodedPath}`, { method: "PUT", body: JSON.stringify({ message, content: Buffer.from(content, "utf8").toString("base64"), branch, ...(sha ? { sha } : {}) }) });
  return { path: body.content?.path || path, sha: body.content?.sha || "" };
}

export async function deleteGithubFile(path: string, sha: string, message: string) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  await githubRequest<GithubResponse>(`/repos/${repo}/contents/${encodedPath}`, { method: "DELETE", body: JSON.stringify({ message, sha, branch }) });
}

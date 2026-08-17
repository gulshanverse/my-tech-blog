import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { hasAuthorSession } from "@/lib/author-auth";
import { articlePath, draftToSource, getGithubArticles, inputFromSource, normalizeDraftInput, validateDraft } from "@/lib/author-articles";
import { deleteGithubFile, getGithubFile, githubContentConfigured, writeGithubFile } from "@/lib/github-content";
import { getCategory, parsePostSource } from "@/lib/content";

function unauthorized() { return NextResponse.json({ error: "Author Studio access is required." }, { status: 401 }); }
function unavailable() { return NextResponse.json({ error: "GitHub publishing is not configured on the server. Add the required private environment variables before using Author Studio mutations." }, { status: 503 }); }
function refreshPublicContent() { revalidatePath("/", "layout"); revalidatePath("/blog", "page"); revalidatePath("/sitemap.xml"); revalidatePath("/feed.xml"); }
function isArticlePath(path: string) { return /^content\/blog\/(ai|engineering|programming|research|projects|learning)\/[a-z0-9]+(?:-[a-z0-9]+)*\.mdx$/.test(path); }

export async function GET(request: Request) {
  if (!(await hasAuthorSession())) return unauthorized();
  if (!githubContentConfigured()) return unavailable();
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  try {
    if (path) {
      if (!isArticlePath(path)) return NextResponse.json({ error: "Only article MDX files can be managed here." }, { status: 400 });
      const file = await getGithubFile(path);
      if (!file) return NextResponse.json({ error: "Article file was not found." }, { status: 404 });
      return NextResponse.json({ path: file.path, sha: file.sha, input: inputFromSource(file.path, file.content) });
    }
    const articles = await getGithubArticles();
    return NextResponse.json({ articles: articles.map(({ post, path, sha }) => ({ post, path, sha })) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to read the GitHub content." }, { status: 502 }); }
}

export async function POST(request: Request) {
  if (!(await hasAuthorSession())) return unauthorized();
  if (!githubContentConfigured()) return unavailable();
  try {
    const body = await request.json() as { action?: string; input?: Record<string, unknown>; path?: string; newSlug?: string; paths?: string[] };
    if (body.action === "validate") {
      const input = normalizeDraftInput(body.input || {});
      const existingPaths = (await getGithubArticles()).map((article) => article.path);
      const validation = await validateDraft(input, existingPaths.filter((path) => path !== body.path));
      return NextResponse.json({ ok: true, validation });
    }
    if (body.action === "bulkDelete") {
      const paths = Array.isArray(body.paths) ? [...new Set(body.paths)] : [];
      if (!paths.length || paths.length > 50 || paths.some((path) => !isArticlePath(path))) return NextResponse.json({ error: "Select between 1 and 50 valid article drafts." }, { status: 400 });
      let deleted = 0;
      for (const path of paths) {
        const current = await getGithubFile(path);
        if (!current) continue;
        const category = path.split("/")[2];
        const slug = path.split("/").pop()!.replace(/\.mdx$/, "");
        const post = parsePostSource(current.content, category as never, slug);
        if (post.status !== "draft") continue;
        await deleteGithubFile(path, current.sha, `delete: draft ${slug}`);
        deleted += 1;
      }
      return NextResponse.json({ ok: true, deleted });
    }
    if (body.action === "duplicate") {
      if (!body.path || !body.newSlug || !isArticlePath(body.path)) return NextResponse.json({ error: "A valid source article and new slug are required." }, { status: 400 });
      const sourceFile = await getGithubFile(body.path);
      if (!sourceFile) return NextResponse.json({ error: "The source article was not found." }, { status: 404 });
      const sourceInput = inputFromSource(body.path, sourceFile.content);
      const input = normalizeDraftInput({ ...sourceInput, slug: String(body.newSlug).trim().toLowerCase(), status: "draft", date: new Date().toISOString().slice(0, 10), updatedAt: "", featured: false });
      const targetPath = articlePath(input.category, input.slug);
      if (await getGithubFile(targetPath)) return NextResponse.json({ error: "Article already exists. Choose a different slug." }, { status: 409 });
      const validation = await validateDraft(input);
      if (!validation.valid) return NextResponse.json({ error: validation.errors.join(" "), validation }, { status: 400 });
      await writeGithubFile(targetPath, draftToSource(input), `draft: duplicate ${input.slug}`);
      return NextResponse.json({ ok: true, path: targetPath });
    }
    const input = normalizeDraftInput(body.input || {});
    const targetPath = articlePath(input.category, input.slug);
    if (await getGithubFile(targetPath)) return NextResponse.json({ error: "Article already exists. Choose Edit existing article, change the slug, or cancel." }, { status: 409 });
    const validation = await validateDraft(input);
    if (!validation.valid) return NextResponse.json({ error: validation.errors.join(" "), validation }, { status: 400 });
    const result = await writeGithubFile(targetPath, draftToSource(input), `${input.status === "published" ? "publish" : "draft"}: ${input.title}`);
    if (input.status === "published") refreshPublicContent();
    return NextResponse.json({ ok: true, path: targetPath, sha: result.sha, published: input.status === "published" });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save the article." }, { status: 502 }); }
}

export async function PUT(request: Request) {
  if (!(await hasAuthorSession())) return unauthorized();
  if (!githubContentConfigured()) return unavailable();
  try {
    const body = await request.json() as { path?: string; sha?: string; input?: Record<string, unknown>; confirmed?: boolean };
    if (!body.path || !body.input || !isArticlePath(body.path)) return NextResponse.json({ error: "A valid article path and content are required." }, { status: 400 });
    const current = await getGithubFile(body.path);
    if (!current) return NextResponse.json({ error: "The article file was not found." }, { status: 404 });
    const currentPost = parsePostSource(current.content, body.path.split("/")[2] as never, body.path.split("/").pop()!.replace(/\.mdx$/, ""));
    const input = normalizeDraftInput(body.input);
    const targetPath = articlePath(input.category, input.slug);
    if (targetPath !== body.path && await getGithubFile(targetPath)) return NextResponse.json({ error: "Article already exists. Choose a different slug or category." }, { status: 409 });
    if (currentPost.status === "published" && input.status === "published" && !body.confirmed) return NextResponse.json({ error: "This article is published. Explicit confirmation is required before overwriting the published version.", requiresConfirmation: true }, { status: 409 });
    const existingPaths = (await getGithubArticles()).map((article) => article.path).filter((path) => path !== body.path);
    const validation = await validateDraft(input, existingPaths);
    if (!validation.valid) return NextResponse.json({ error: validation.errors.join(" "), validation }, { status: 400 });
    const result = await writeGithubFile(targetPath, draftToSource(input), `${input.status === "published" ? "publish" : "draft"}: update ${input.title}`, body.sha || current.sha);
    if (targetPath !== body.path) await deleteGithubFile(body.path, current.sha, `chore: move article ${currentPost.slug}`);
    if (input.status === "published") refreshPublicContent();
    return NextResponse.json({ ok: true, path: targetPath, sha: result.sha, published: input.status === "published" });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update the article." }, { status: 502 }); }
}

export async function DELETE(request: Request) {
  if (!(await hasAuthorSession())) return unauthorized();
  if (!githubContentConfigured()) return unavailable();
  try {
    const body = await request.json() as { path?: string; sha?: string };
    if (!body.path || !isArticlePath(body.path)) return NextResponse.json({ error: "A valid article path is required." }, { status: 400 });
    const current = await getGithubFile(body.path);
    if (!current) return NextResponse.json({ error: "The article file was not found." }, { status: 404 });
    const category = body.path.split("/")[2];
    const slug = body.path.split("/").pop()!.replace(/\.mdx$/, "");
    const post = parsePostSource(current.content, category as never, slug);
    if (post.status === "published") return NextResponse.json({ error: "Published articles cannot be deleted from Author Studio. Save an unpublished revision or edit the article instead." }, { status: 409 });
    await deleteGithubFile(body.path, body.sha || current.sha, `delete: draft ${slug}`);
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete the draft." }, { status: 502 }); }
}

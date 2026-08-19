import { NextResponse } from "next/server";
import { hasAuthorSession } from "@/lib/author-auth";
import { getLocalProjects, getSourceShas, saveProjects } from "@/lib/author-content";
import { validateProjectCollection, validateProjectInput, type ProjectInput } from "@/lib/content-management";

export const dynamic = "force-dynamic";

function unauthorized() { return NextResponse.json({ error: "Author Studio access is required." }, { status: 401 }); }

export async function GET() {
  if (!(await hasAuthorSession())) return unauthorized();
  return NextResponse.json({ projects: getLocalProjects(), shas: await getSourceShas() }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  if (!(await hasAuthorSession())) return unauthorized();
  try {
    const body = await request.json() as { action?: string; project?: Partial<ProjectInput>; projects?: ProjectInput[]; sha?: string };
    if (body.action === "validate") {
      const errors = validateProjectInput(body.project || {});
      return NextResponse.json({ valid: errors.length === 0, errors });
    }
    const next = Array.isArray(body.projects) ? body.projects : null;
    if (!next) return NextResponse.json({ error: "Projects payload is required." }, { status: 400 });
    if (!body.sha || typeof body.sha !== "string") return NextResponse.json({ error: "Projects source SHA is required. Reload before saving again." }, { status: 400 });
    const errors = validateProjectCollection(next);
    if (errors.length) return NextResponse.json({ error: errors[0], errors }, { status: 400 });
    const result = await saveProjects(next, body.sha);
    return NextResponse.json({ ok: true, sha: result.sha });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save projects." }, { status: 502 });
  }
}

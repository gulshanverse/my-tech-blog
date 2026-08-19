import { NextResponse } from "next/server";
import { hasAuthorSession } from "@/lib/author-auth";
import { getLocalTopics, getSourceShas, saveTopics } from "@/lib/author-content";
import { validateTopicInput, type TopicInput } from "@/lib/content-management";

export const dynamic = "force-dynamic";

function unauthorized() { return NextResponse.json({ error: "Author Studio access is required." }, { status: 401 }); }

export async function GET() {
  if (!(await hasAuthorSession())) return unauthorized();
  return NextResponse.json({ topics: getLocalTopics(), shas: await getSourceShas() }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  if (!(await hasAuthorSession())) return unauthorized();
  try {
    const body = await request.json() as { action?: string; topic?: Partial<TopicInput>; topics?: TopicInput[]; sha?: string };
    if (body.action === "validate") {
      const errors = validateTopicInput(body.topic || {});
      return NextResponse.json({ valid: errors.length === 0, errors });
    }
    const next = Array.isArray(body.topics) ? body.topics : null;
    if (!next) return NextResponse.json({ error: "Topics payload is required." }, { status: 400 });
    const result = await saveTopics(next, body.sha);
    return NextResponse.json({ ok: true, sha: result.sha });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save topics." }, { status: 502 });
  }
}

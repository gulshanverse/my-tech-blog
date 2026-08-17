import { NextResponse } from "next/server";
import { authorCookieOptions, authorSessionCookie, createAuthorSession, isAuthorStudioConfigured } from "@/lib/author-auth";

const failedAttempts = new Map<string, { count: number; startedAt: number }>();
const windowMs = 10 * 60 * 1000;
const maxAttempts = 8;

export async function POST(request: Request) {
  if (!isAuthorStudioConfigured()) return NextResponse.json({ error: "Author Studio authentication is not configured on the server." }, { status: 503 });
  const clientKey = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const attempt = failedAttempts.get(clientKey);
  if (attempt && Date.now() - attempt.startedAt < windowMs && attempt.count >= maxAttempts) return NextResponse.json({ error: "Too many sign-in attempts. Try again later." }, { status: 429 });
  const body = await request.json().catch(() => ({})) as { username?: string; password?: string };
  if (body.username !== (process.env.AUTHOR_STUDIO_USERNAME || "gulshanverse") || body.password !== process.env.AUTHOR_STUDIO_PASSWORD) {
    const nextAttempt = attempt && Date.now() - attempt.startedAt < windowMs ? { count: attempt.count + 1, startedAt: attempt.startedAt } : { count: 1, startedAt: Date.now() };
    failedAttempts.set(clientKey, nextAttempt);
    return NextResponse.json({ error: "Invalid author credentials." }, { status: 401 });
  }
  failedAttempts.delete(clientKey);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(authorSessionCookie, createAuthorSession(body.username), authorCookieOptions());
  return response;
}

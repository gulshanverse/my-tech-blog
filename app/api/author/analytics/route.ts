import { NextResponse } from "next/server";
import { buildEditorialAnalytics, getAnalyticsRange, isAnalyticsRange, type AnalyticsRangeKey } from "@/lib/analytics";
import { getGithubArticles } from "@/lib/author-articles";
import { hasAuthorSession } from "@/lib/author-auth";
import { githubContentConfigured } from "@/lib/github-content";
import { getSearchConsoleConfigStatus, getSearchConsoleData } from "@/lib/google-search-console";

export const dynamic = "force-dynamic";

function unauthorized() { return NextResponse.json({ error: "Author Studio access is required." }, { status: 401 }); }
function invalidRange() { return NextResponse.json({ error: "Choose a valid analytics range: 7d, 28d, 3m, or 6m." }, { status: 400 }); }

export async function GET(request: Request) {
  if (!(await hasAuthorSession())) return unauthorized();
  const searchParams = new URL(request.url).searchParams;
  const requestedRange = searchParams.get("range") || "28d";
  const compact = searchParams.get("summary") === "1";
  if (!isAnalyticsRange(requestedRange)) return invalidRange();
  const rangeKey = requestedRange as AnalyticsRangeKey;
  const gscStatus = getSearchConsoleConfigStatus();
  const range = getAnalyticsRange(rangeKey);
  const repository = { state: githubContentConfigured() ? "available" : "not-configured" as const, reason: githubContentConfigured() ? undefined : "not_configured" };
  try {
    const [articlesResult, searchConsole] = await Promise.all([
      githubContentConfigured() ? getGithubArticles() : Promise.resolve([]),
      getSearchConsoleData(rangeKey),
    ]);
    const articles = articlesResult.map(({ post }) => post);
    const sources = { searchConsole: { ownership: "verified", api: gscStatus.configured ? searchConsole.data.state : "not-configured", siteUrlConfigured: gscStatus.siteConfigured, credentialsConfigured: gscStatus.credentialsConfigured }, siteAnalytics: { state: "not-configured", reason: "no_server_provider_configured" }, repository };
    if (compact) return NextResponse.json({ source: "author-analytics-summary", range, searchConsole: searchConsole.data, sources }, { headers: { "Cache-Control": "private, no-store" } });
    return NextResponse.json({ source: "author-analytics", range, editorial: buildEditorialAnalytics(articles), searchConsole: searchConsole.data, sources }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[analytics] Analytics payload failed", { provider: "author-analytics", configuration: "repository-or-search-console", reason: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "Unable to retrieve analytics data." }, { status: 502, headers: { "Cache-Control": "private, no-store" } });
  }
}

import { getAnalyticsRange, normalizeSearchConsoleResponse, type AnalyticsRange, type SearchConsoleData } from "@/lib/analytics";

const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const API_BASE = "https://www.googleapis.com/webmasters/v3/sites";

type Config = { siteUrl: string; clientId: string; clientSecret: string; refreshToken: string };
type SearchResponse = { rows?: unknown[] };

function config(): Config | null {
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim();
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN?.trim();
  return siteUrl && clientId && clientSecret && refreshToken ? { siteUrl, clientId, clientSecret, refreshToken } : null;
}

export function getSearchConsoleConfigStatus() {
  const configured = config();
  return { configured: Boolean(configured), siteConfigured: Boolean(process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim()), credentialsConfigured: Boolean(process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID?.trim() && process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET?.trim() && process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN?.trim()) };
}

async function getAccessToken(settings: Config) {
  const response = await fetch(TOKEN_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: settings.clientId, client_secret: settings.clientSecret, refresh_token: settings.refreshToken, grant_type: "refresh_token", scope: SEARCH_CONSOLE_SCOPE }), cache: "no-store" });
  if (!response.ok) { console.error("[analytics] Search Console token request failed", { status: response.status, endpoint: "oauth-token", configuration: "configured" }); throw new Error("Search Console authentication failed."); }
  const body = await response.json().catch(() => ({})) as { access_token?: unknown };
  if (typeof body.access_token !== "string" || !body.access_token) throw new Error("Search Console authentication failed.");
  return body.access_token;
}

async function query(accessToken: string, settings: Config, range: AnalyticsRange, dimensions: string[]) {
  const endpoint = `${API_BASE}/${encodeURIComponent(settings.siteUrl)}/searchAnalytics/query`;
  const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ startDate: range.startDate, endDate: range.endDate, dimensions, type: "web", rowLimit: dimensions[0] === "date" ? 500 : 100 }), cache: "no-store" });
  if (!response.ok) { console.error("[analytics] Search Console query failed", { status: response.status, endpoint: "searchanalytics-query", configuration: "configured" }); throw new Error("Search Console data could not be retrieved."); }
  const body = await response.json().catch(() => ({})) as SearchResponse;
  return body.rows || [];
}

export async function getSearchConsoleData(rangeKey: Parameters<typeof getAnalyticsRange>[0]): Promise<{ range: AnalyticsRange; data: SearchConsoleData }> {
  const range = getAnalyticsRange(rangeKey);
  const settings = config();
  if (!settings) return { range, data: { state: "not-configured", reason: "not_configured", metrics: null, trend: [], queries: [], pages: [] } };
  try {
    const accessToken = await getAccessToken(settings);
    const [trend, queries, pages] = await Promise.all([query(accessToken, settings, range, ["date"]), query(accessToken, settings, range, ["query"]), query(accessToken, settings, range, ["page"])]);
    const data = normalizeSearchConsoleResponse({ trend, queries, pages });
    return { range, data };
  } catch (error) {
    if (error instanceof Error && error.message === "Search Console data could not be retrieved.") return { range, data: { state: "error", reason: "provider_error", metrics: null, trend: [], queries: [], pages: [] } };
    return { range, data: { state: "error", reason: "provider_error", metrics: null, trend: [], queries: [], pages: [] } };
  }
}

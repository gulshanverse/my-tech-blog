import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthorAnalytics } from "@/components/author-analytics";
import { getAnalyticsRange } from "@/lib/analytics";
import { getGithubArticles } from "@/lib/author-articles";
import { hasAuthorSession } from "@/lib/author-auth";
import { githubContentConfigured } from "@/lib/github-content";
import { getSearchConsoleConfigStatus, getSearchConsoleData } from "@/lib/google-search-console";
import { buildEditorialAnalytics } from "@/lib/analytics";

export const metadata: Metadata = { title: "Analytics Center — Author Studio", robots: { index: false, follow: false, nocache: true } };

export default async function AuthorAnalyticsPage() {
  if (!(await hasAuthorSession())) redirect("/author/login");
  const range = getAnalyticsRange("28d");
  const gscStatus = getSearchConsoleConfigStatus();
  const articlesResult = githubContentConfigured() ? await getGithubArticles().catch(() => []) : [];
  const searchConsole = await getSearchConsoleData("28d");
  const articles = articlesResult.map(({ post }) => post);
  return <AuthorAnalytics initialData={{ range, editorial: buildEditorialAnalytics(articles), searchConsole: searchConsole.data, sources: { searchConsole: { ownership: "verified", api: gscStatus.configured ? searchConsole.data.state : "not-configured", siteUrlConfigured: gscStatus.siteConfigured, credentialsConfigured: gscStatus.credentialsConfigured }, siteAnalytics: { state: "not-configured", reason: "no_server_provider_configured" }, repository: { state: githubContentConfigured() ? "available" : "not-configured" } } }} />;
}

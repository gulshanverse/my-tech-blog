import { redirect } from "next/navigation";
import { AuthorStudio } from "@/components/author-studio";
import { hasAuthorSession } from "@/lib/author-auth";
import { isArticlePath } from "@/lib/author-articles";

export default async function AuthorEditorPage({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  if (!(await hasAuthorSession())) redirect("/author/login");
  const params = await searchParams;
  const requestedPath = typeof params.path === "string" ? params.path.trim() : "";
  const initialPathError = requestedPath && !isArticlePath(requestedPath) ? "Only article MDX files can be opened in Author Studio." : "";
  return <AuthorStudio initialView="editor" initialPath={requestedPath} initialPathError={initialPathError} />;
}

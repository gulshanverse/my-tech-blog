import { redirect } from "next/navigation";
import { AuthorStudio } from "@/components/author-studio";
import { hasAuthorSession } from "@/lib/author-auth";

export default async function AuthorEditorPage({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  if (!(await hasAuthorSession())) redirect("/author/login");
  const params = await searchParams;
  return <AuthorStudio initialView="editor" initialPath={params.path || ""} />;
}

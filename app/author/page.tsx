import { redirect } from "next/navigation";
import { AuthorStudio } from "@/components/author-studio";
import { hasAuthorSession } from "@/lib/author-auth";

export default async function AuthorPage({ searchParams }: { searchParams?: Promise<{ type?: string }> }) {
  if (!(await hasAuthorSession())) redirect("/author/login");
  const params = searchParams ? await searchParams : {};
  const contentType = params.type === "projects" || params.type === "topics" ? params.type : "blog";
  return <AuthorStudio initialContentType={contentType} />;
}

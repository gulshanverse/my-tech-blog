import { redirect } from "next/navigation";
import { AuthorStudio } from "@/components/author-studio";
import { hasAuthorSession } from "@/lib/author-auth";

export default async function AuthorEditorPage() {
  if (!(await hasAuthorSession())) redirect("/author/login");
  return <AuthorStudio initialView="editor" />;
}

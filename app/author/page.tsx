import { redirect } from "next/navigation";
import { AuthorStudio } from "@/components/author-studio";
import { hasAuthorSession } from "@/lib/author-auth";

export default async function AuthorPage() {
  if (!(await hasAuthorSession())) redirect("/author/login");
  return <AuthorStudio />;
}

import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "@/components/mdx-components";

export function ArticleBody({ source }: { source: string }) {
  return <MDXRemote source={source} components={mdxComponents} options={{ blockJS: true, blockDangerousJS: true, mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug, [rehypePrettyCode, { theme: "github-dark-dimmed" }]] } }} />;
}

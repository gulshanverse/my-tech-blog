import { topicMeta } from "./topic-data";

export const siteConfig = {
  name: "Gulshan Kumar",
  handle: "@gulshanverse",
  role: "3rd Year B.Tech Undergraduate in Information Technology",
  tagline: "Building, learning, and writing about AI, software, and technology.",
  description: "A personal technology publication about AI, software engineering, projects, research, and the lessons learned while building.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://gulshanblogs.vercel.app",
  emailAddress: "gulshankumaritggv@gmail.com",
  links: {
    github: "https://github.com/gulshanverse",
    x: "https://x.com/gulshanverse",
    reddit: "https://www.reddit.com/user/gulshanverse/",
    linkedin: "https://www.linkedin.com/in/gulshan-kumar/",
    leetcode: "https://leetcode.com/u/gulshanverse/",
    email: "mailto:gulshankumaritggv@gmail.com",
  },
  socials: [
    { label: "GitHub", href: "https://github.com/gulshanverse" },
    { label: "X", href: "https://x.com/gulshanverse" },
    { label: "Reddit", href: "https://www.reddit.com/user/gulshanverse/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/gulshan-kumar/" },
    { label: "LeetCode", href: "https://leetcode.com/u/gulshanverse/" },
  ],
} as const;

export const categoryMeta = topicMeta;
export type CategorySlug = keyof typeof categoryMeta;

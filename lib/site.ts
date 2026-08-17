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

export const categoryMeta = {
  ai: { slug: "ai", name: "AI & Machine Learning", shortName: "AI & ML", description: "Models, agents, retrieval, and the engineering practice behind useful AI systems." },
  engineering: { slug: "engineering", name: "Software Engineering", shortName: "Software", description: "Architecture, developer tools, systems, and the habits that keep software dependable." },
  programming: { slug: "programming", name: "Programming & DSA", shortName: "Programming", description: "Problem solving, algorithms, and practical programming lessons from the workbench." },
  research: { slug: "research", name: "Research & Technology", shortName: "Research", description: "Paper notes, technical analysis, and clear thinking about technologies shaping tomorrow." },
  projects: { slug: "projects", name: "Projects & Experiments", shortName: "Projects", description: "Build logs that unpack the problem, decisions, trade-offs, and lessons behind a project." },
  learning: { slug: "learning", name: "Learning Journal", shortName: "Learning", description: "Honest notes about what clicked, what broke, and what I am learning next." },
} as const;

export type CategorySlug = keyof typeof categoryMeta;

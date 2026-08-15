export const siteConfig = {
  name: "Gulshan Kumar",
  role: "3rd Year B.Tech Undergraduate in Information Technology",
  tagline: "Building, learning, and writing about AI, software, and technology.",
  description: "A personal technology publication about AI, software engineering, projects, research, and the lessons learned while building.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://gulshanblogs.vercel.app",
  links: {
    github: "https://github.com/gulshanverse",
    linkedin: "https://www.linkedin.com/in/gulshan-kumar/",
    x: "https://x.com/gulshanverse",
    email: "mailto:gulshankumar.dev@gmail.com",
  },
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

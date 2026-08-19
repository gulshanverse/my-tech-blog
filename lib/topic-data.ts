export type TopicRecord = {
  slug: string;
  name: string;
  shortName: string;
  description: string;
};

export const topicMeta: Record<string, TopicRecord> = {
  ai: { slug: "ai", name: "AI & Machine Learning", shortName: "AI & ML", description: "Models, agents, retrieval, and the engineering practice behind useful AI systems." },
  engineering: { slug: "engineering", name: "Software Engineering", shortName: "Software", description: "Architecture, developer tools, systems, and the habits that keep software dependable." },
  programming: { slug: "programming", name: "Programming & DSA", shortName: "Programming", description: "Problem solving, algorithms, and practical programming lessons from the workbench." },
  research: { slug: "research", name: "Research & Technology", shortName: "Research", description: "Paper notes, technical analysis, and clear thinking about technologies shaping tomorrow." },
  projects: { slug: "projects", name: "Projects & Experiments", shortName: "Projects", description: "Build logs that unpack the problem, decisions, trade-offs, and lessons behind a project." },
  learning: { slug: "learning", name: "Learning Journal", shortName: "Learning", description: "Honest notes about what clicked, what broke, and what I am learning next." },
};

export const topics = Object.values(topicMeta);

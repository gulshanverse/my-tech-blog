export type Project = {
  slug: string;
  name: string;
  category: string;
  description: string;
  coverImage: string;
  status: string;
  stack: string[];
  github?: string;
  demo?: string;
  problem: string;
  solution: string;
  architecture: string[];
  features: string[];
  lessons: string;
};

export const projects: Project[] = [
  {
    slug: "railyatra",
    name: "RailYatra",
    category: "Full-stack product",
    description: "A thoughtful travel planning experience that turns a complicated railway journey into a clearer, more useful flow.",
    coverImage: "/images/project-railyatra.png",
    status: "Iterating",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Tailwind"],
    github: "https://github.com/gulshanverse",
    problem: "Travel information is often scattered across multiple steps, interfaces, and assumptions. The goal was to explore how a focused product could make planning feel calmer.",
    solution: "RailYatra brings the essential journey context into one responsive surface, with a content-first interface and room for richer route intelligence later.",
    architecture: ["Typed route and search state", "Server-rendered content surfaces", "Composable UI primitives", "Data layer ready for live integrations"],
    features: ["Journey-first information hierarchy", "Responsive mobile flow", "Reusable trip summary components", "Accessible keyboard navigation"],
    lessons: "The most useful product decisions were less about adding features and more about deciding which uncertainty to remove first.",
  },
  {
    slug: "signalboard",
    name: "Signalboard",
    category: "AI experiment",
    description: "A small workspace for comparing retrieval prompts, context windows, and the quality of answers from language models.",
    coverImage: "/images/project-signalboard.png",
    status: "Prototype",
    stack: ["Python", "FastAPI", "LLM APIs", "RAG"],
    github: "https://github.com/gulshanverse",
    problem: "It is hard to learn what makes a retrieval system useful when every experiment changes several variables at once.",
    solution: "Signalboard treats each prompt, chunking strategy, and response as a visible experiment so the learning loop stays inspectable.",
    architecture: ["Experiment configuration", "Retriever and reranker boundary", "Prompt trace storage", "Evaluation notes"],
    features: ["Side-by-side prompt runs", "Context inspection", "Lightweight evaluation rubric", "Exportable experiment notes"],
    lessons: "Good AI engineering starts with observability. If the system cannot show why it answered, improvement becomes guesswork.",
  },
  {
    slug: "campus-circles",
    name: "Campus Circles",
    category: "Community platform",
    description: "A campus-first project exploring how students can find collaborators for learning, clubs, and small technical builds.",
    coverImage: "/images/project-campus-circles.png",
    status: "Shipped",
    stack: ["React", "Node.js", "MongoDB", "GitHub Actions"],
    github: "https://github.com/gulshanverse",
    problem: "Students frequently want to build together but lack a simple, low-pressure way to discover shared interests.",
    solution: "The project focuses on lightweight profiles, interest signals, and project briefs rather than a noisy social feed.",
    architecture: ["Profile and interest model", "Searchable project briefs", "Simple moderation boundary", "CI checks on every change"],
    features: ["Interest-based discovery", "Project brief templates", "Responsive cards", "Clear empty states"],
    lessons: "A project becomes more approachable when its first action is obvious and its data model mirrors the real-world conversation.",
  },
  {
    slug: "paper-to-prototype",
    name: "Paper to Prototype",
    category: "Research notes",
    description: "A reading workflow for turning research papers into short implementation notes, diagrams, and testable questions.",
    coverImage: "/images/project-paper-to-prototype.png",
    status: "Ongoing",
    stack: ["Python", "Markdown", "Mermaid", "Git"],
    github: "https://github.com/gulshanverse",
    problem: "Reading a paper is different from understanding what to build. The gap between the two is where many notes disappear.",
    solution: "This workflow captures the paper claim, the mechanism, the trade-offs, and the smallest experiment that could challenge the idea.",
    architecture: ["Structured note template", "Versioned Markdown", "Diagram-first explanations", "Experiment backlog"],
    features: ["Claim and evidence sections", "Architecture sketch", "Implementation questions", "Lessons learned log"],
    lessons: "The best reading notes are not summaries. They are invitations to ask a sharper engineering question.",
  },
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

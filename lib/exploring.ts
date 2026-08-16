export type ExploringItem = {
  number: string;
  title: string;
  description: string;
};

export const exploringItems: ExploringItem[] = [
  { number: "01", title: "AI agents", description: "Building systems that can reason, use tools, and complete tasks." },
  { number: "02", title: "RAG and LLM systems", description: "Retrieval, vector search, and production knowledge systems." },
  { number: "03", title: "Software architecture", description: "Designing reliable systems and understanding their trade-offs." },
  { number: "04", title: "Research workflows", description: "Turning papers and developer tools into testable implementation notes." },
];

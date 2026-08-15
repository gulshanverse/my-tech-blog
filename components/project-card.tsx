import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/projects";

export function ProjectCard({ project }: { project: Project }) {
  return <Link className="project-card" href={`/projects/${project.slug}`}><div className="project-art" aria-hidden="true" /><div className="project-content"><div className="card-meta"><span className="category">{project.category}</span></div><h3>{project.name}</h3><p className="card-description">{project.description}</p><span className="status">{project.status}</span><span className="card-arrow">View project <ArrowUpRight size={15} /></span></div></Link>;
}

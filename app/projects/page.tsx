import type { Metadata } from "next";
import { ProjectCard } from "@/components/project-card";
import { projects } from "@/lib/projects";

export const metadata: Metadata = { title: "Projects", description: "Selected projects and experiments by Gulshan Kumar, from full-stack products to AI research workflows." };

export default function ProjectsPage() { return <><section className="page-hero"><div className="container"><div className="eyebrow">The workbench</div><h1>From question<br /><span className="serif">to prototype.</span></h1><p>Projects are where ideas meet constraints. These are the products, experiments, and research workflows I am building to learn by doing.</p></div></section><section className="section"><div className="container"><div className="section-heading"><div><div className="eyebrow">Selected work</div><h2>A portfolio,<br />but in context.</h2></div><p>Every project has a problem, a set of trade-offs, and a lesson worth carrying forward.</p></div><div className="project-grid">{projects.map((project) => <ProjectCard key={project.slug} project={project} />)}</div></div></section></>; }

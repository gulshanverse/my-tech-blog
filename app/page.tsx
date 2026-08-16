import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CurrentlyExploring } from "@/components/currently-exploring";
import { LatestWriting, SelectedWriting } from "@/components/home-publishing";
import { ProjectCard } from "@/components/project-card";
import { categoryMeta } from "@/lib/site";
import { getAllPosts } from "@/lib/content";
import { projects } from "@/lib/projects";

export default function HomePage() {
  const posts = getAllPosts();
  const topics = Object.values(categoryMeta);

  return <>
    <section className="hero"><div className="container"><div className="hero-grid"><div><div className="eyebrow hero-kicker">Personal technology publication · 2026</div><h1 className="hero-title">Building,<br /><em>learning,</em><br />writing.</h1><p className="hero-lede">I&apos;m Gulshan Kumar, a 3rd-year B.Tech Information Technology undergraduate exploring artificial intelligence, software engineering, and emerging technologies through projects, experiments, research, and technical writing.</p><div className="hero-actions"><Link className="btn btn-primary" href="/blog">Read the blog <ArrowRight size={16} /></Link><Link className="btn btn-secondary" href="/projects">Explore projects <ArrowUpRight size={16} /></Link></div></div><div className="hero-index"><div className="hero-index-label">What you&apos;ll find here</div><div className="hero-index-row"><span className="hero-index-number">01</span><span className="hero-index-text">Technical deep dives</span></div><div className="hero-index-row"><span className="hero-index-number">02</span><span className="hero-index-text">Projects in progress</span></div><div className="hero-index-row"><span className="hero-index-number">03</span><span className="hero-index-text">Notes from the journey</span></div></div></div></div></section>
    <CurrentlyExploring />
    <SelectedWriting posts={posts} />
    <LatestWriting posts={posts} />
    <section className="section"><div className="container"><div className="section-heading"><div><div className="eyebrow">04 / Explore topics</div><h2>Follow the<br />threads.</h2></div><Link className="section-link" href="/topics">Browse topics <ArrowUpRight size={15} /></Link></div><div className="topic-grid">{topics.map((topic, index) => <Link className="topic-card" href={`/topics/${topic.slug}`} key={topic.slug}><div className="topic-card-number"><span>0{index + 1}</span><ArrowUpRight size={16} /></div><h3>{topic.name}</h3><p>{topic.description}</p></Link>)}</div></div></section>
    <section className="section soft-section"><div className="container"><div className="section-heading"><div><div className="eyebrow">05 / Selected projects</div><h2>From question<br />to prototype.</h2></div><Link className="section-link" href="/projects">See all projects <ArrowUpRight size={15} /></Link></div><div className="project-grid">{projects.slice(0, 4).map((project) => <ProjectCard key={project.slug} project={project} />)}</div></div></section>
    <section className="section"><div className="container"><div className="about-band"><div><div className="eyebrow">06 / A little context</div><h2>A student building in public.</h2></div><div><p>I&apos;m interested in the space where a strong technical idea becomes a useful system. This publication is where I document that process honestly: the models that surprise me, the code that breaks, and the concepts that finally click.</p><p className="pull-quote">“The archive matters because the journey is part of the work.”</p><Link className="section-link" href="/about">More about the journey <ArrowUpRight size={15} /></Link></div></div></div></section>
    <section className="follow-band"><div className="container"><div className="follow-wrap"><div><h2>Follow the next experiment.</h2><p>There is no newsletter yet. For now, the best way to keep in touch is GitHub or email.</p></div><Link className="btn btn-gold" href="/contact">Say hello <ArrowUpRight size={16} /></Link></div></div></section>
  </>;
}

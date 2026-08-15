import type { Metadata } from "next";
import { ArrowUpRight, Github, Linkedin, Mail } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Gulshan Kumar about technology, AI, software development, projects, and collaboration.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">Start a conversation</div>
          <h1>Let&apos;s Connect</h1>
          <p>Have a question, want to discuss a project, or just want to say hello? Feel free to reach out.</p>
        </div>
      </section>
      <section className="section contact-section" aria-labelledby="contact-heading">
        <div className="container">
          <div className="contact-layout">
            <div className="contact-intro">
              <div className="eyebrow">Contact</div>
              <h2 id="contact-heading">Thoughtful messages are always welcome.</h2>
              <p className="contact-lede">Whether you found a useful idea in the archive, are working through a similar technical problem, or have a project worth discussing, send a note. I read every message.</p>
              <div className="contact-direct">
                <p className="contact-direct-label">You can also reach me directly at</p>
                <a className="contact-email" href={siteConfig.links.email}><Mail size={16} aria-hidden="true" />gulshankumar.dev@gmail.com<ArrowUpRight size={15} aria-hidden="true" /></a>
              </div>
              <div className="contact-socials" aria-label="Social links">
                <a href={siteConfig.links.github} target="_blank" rel="noreferrer"><Github size={16} aria-hidden="true" />GitHub<ArrowUpRight size={13} aria-hidden="true" /></a>
                <a href={siteConfig.links.linkedin} target="_blank" rel="noreferrer"><Linkedin size={16} aria-hidden="true" />LinkedIn<ArrowUpRight size={13} aria-hidden="true" /></a>
                <a href={siteConfig.links.x} target="_blank" rel="noreferrer" aria-label="X, formerly Twitter">X<ArrowUpRight size={13} aria-hidden="true" /></a>
              </div>
            </div>
            <div className="contact-form-card">
              <div className="contact-form-heading">
                <div>
                  <div className="eyebrow">Write in</div>
                  <h2>Send a message</h2>
                </div>
                <span aria-hidden="true">01 / 01</span>
              </div>
              <ContactForm />
              <p className="contact-form-note">The form is protected with server-side validation and a lightweight anti-spam check. Delivery is currently being connected; use the direct email link for a guaranteed route.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

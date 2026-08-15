import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { categoryMeta, type CategorySlug } from "@/lib/site";
import type { RelatedRecommendation } from "@/lib/content";
import { formatDate } from "@/lib/content";

export function RelatedArticles({ recommendations }: { recommendations: RelatedRecommendation[] }) {
  if (!recommendations.length) return null;
  const [lead, ...supporting] = recommendations;
  const leadCategory = categoryMeta[lead.post.category as CategorySlug];

  return <section className="related" aria-labelledby="related-heading"><div className="related-heading"><div><div className="eyebrow"><Sparkles size={13} aria-hidden="true" /> Recommended next</div><h2 id="related-heading">Keep exploring.</h2><p>More notes connected to this idea, selected from the archive.</p></div><Link className="section-link" href={`/topics/${lead.post.category}`}>Browse this topic <ArrowUpRight size={15} /></Link></div><div className="recommendation-grid"><Link className="recommendation-lead" href={`/blog/${lead.post.slug}`}><div className="recommendation-art" aria-hidden="true"><span>{leadCategory?.shortName || "Writing"}</span><span className="recommendation-art-mark">01</span></div><div className="recommendation-copy"><div className="recommendation-reason">{lead.reason}</div><div className="card-meta"><span className="category">{leadCategory?.shortName}</span><span>·</span><span>{formatDate(lead.post.date)}</span><span>·</span><span>{lead.post.readingTime}</span></div><h3>{lead.post.title}</h3><p>{lead.post.description}</p><span className="card-arrow">Read next <ArrowUpRight size={15} /></span></div></Link><div className="recommendation-supporting">{supporting.map((recommendation, index) => { const category = categoryMeta[recommendation.post.category as CategorySlug]; return <Link className="recommendation-mini" href={`/blog/${recommendation.post.slug}`} key={recommendation.post.slug}><div className="recommendation-mini-number">0{index + 2}</div><div><div className="recommendation-reason">{recommendation.reason}</div><h3>{recommendation.post.title}</h3><div className="recommendation-mini-meta">{category?.shortName} · {recommendation.post.readingTime}</div></div><ArrowUpRight className="recommendation-mini-arrow" size={16} /></Link>; })}</div></div></section>;
}

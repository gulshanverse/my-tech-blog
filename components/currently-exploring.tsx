import { exploringItems } from "@/lib/exploring";

export function CurrentlyExploring() {
  return <section className="section exploring-section" aria-labelledby="exploring-heading"><div className="container"><div className="exploring-header"><div><div className="eyebrow">01 / Currently exploring</div><h2 id="exploring-heading">Questions I&apos;m<br />following.</h2></div><p>Learning, researching, and building in public—one practical thread at a time.</p></div><div className="exploring-list">{exploringItems.map((item) => <div className="exploring-item" key={item.number}><span className="exploring-number">{item.number}</span><h3>{item.title}</h3><p>{item.description}</p></div>)}</div></div></section>;
}

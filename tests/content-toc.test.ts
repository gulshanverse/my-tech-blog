import { describe, expect, it } from "vitest";
import { getToc } from "@/lib/content";

describe("getToc", () => {
  it("extracts H2 and H3 sections while ignoring H1 and fenced code headings", () => {
    const items = getToc(`# Article title

## Introduction

### Model

\`\`\`text
## Not a section
\`\`\`

## Tools`);

    expect(items).toEqual([
      { depth: 2, text: "Introduction", slug: "introduction" },
      { depth: 3, text: "Model", slug: "model" },
      { depth: 2, text: "Tools", slug: "tools" },
    ]);
  });

  it("matches rehype-slug IDs for punctuation and duplicate headings", () => {
    const items = getToc("## 01 — From Commands to Intent\n\n## 01 — From Commands to Intent\n\n### Trust.");

    expect(items.map((item) => item.slug)).toEqual([
      "01--from-commands-to-intent",
      "01--from-commands-to-intent-1",
      "trust",
    ]);
  });
});

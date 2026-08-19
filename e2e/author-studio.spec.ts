import { test, expect } from "@playwright/test";

const username = process.env.E2E_AUTHOR_USERNAME;
const password = process.env.E2E_AUTHOR_PASSWORD;
const authenticated = Boolean(username && password);

const publicRoutes = ["/", "/blog", "/blog/agentic-ai-explained", "/topics", "/projects", "/about", "/contact", "/feed.xml", "/sitemap.xml", "/robots.txt"];

test.describe("public regression smoke", () => {
  for (const route of publicRoutes) {
    test(`${route} responds without page overflow`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }

  test("public article layouts keep the canonical content width across old and new articles", async ({ page }) => {
    const articles = [
      { slug: "agentic-ai-explained", expectsToc: false, expectsTable: false },
      { slug: "the-future-of-technology-when-software-starts-to-think-and-act", expectsToc: true, expectsTable: false },
      { slug: "understanding-rag-systems", expectsToc: true, expectsTable: false },
      { slug: "how-to-read-a-research-paper-as-an-engineer", expectsToc: true, expectsTable: true },
    ];
    for (const width of [320, 375, 768, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      for (const article of articles) {
        const response = await page.goto(`/blog/${article.slug}`);
        expect(response?.status()).toBe(200);
        const metrics = await page.evaluate(() => {
          const layout = document.querySelector<HTMLElement>(".article-layout");
          const prose = document.querySelector<HTMLElement>(".article-prose");
          const code = document.querySelector<HTMLElement>(".code-shell");
          const rect = (element: HTMLElement | null) => element ? { width: element.getBoundingClientRect().width, x: element.getBoundingClientRect().x, scrollWidth: element.scrollWidth } : null;
          return { layout: rect(layout), prose: rect(prose), code: rect(code), grid: layout ? getComputedStyle(layout).gridTemplateColumns : "", toc: Boolean(document.querySelector(".toc")), tableWrapper: Boolean(document.querySelector(".article-table-wrapper")), documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth, viewport: window.innerWidth };
        });
        expect(metrics.layout).not.toBeNull();
        expect(metrics.prose).not.toBeNull();
        expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewport);
        expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewport);
        if (width >= 900) {
          expect(metrics.prose!.width).toBeGreaterThanOrEqual(700);
          expect(metrics.layout!.width).toBeGreaterThanOrEqual(Math.min(1180, width - 32));
          expect(metrics.toc).toBe(article.expectsToc);
          expect(metrics.grid).toContain(article.expectsToc ? "210px" : "710px");
        } else {
          expect(metrics.prose!.width).toBeGreaterThan(250);
        }
        if (metrics.code) expect(metrics.code.width).toBe(metrics.prose!.width);
        expect(metrics.tableWrapper).toBe(Boolean(article.expectsTable));
      }
    }
  });

  test("live TOC links, active state, sticky desktop behavior, and mobile navigation work", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/blog/the-future-of-technology-when-software-starts-to-think-and-act");
    const toc = page.locator(".toc");
    await expect(toc).toBeVisible();
    await expect(toc.locator("a")).toHaveCount(28);
    expect(await toc.evaluate((element) => getComputedStyle(element).position)).toBe("sticky");

    const secondLink = toc.locator("a").nth(1);
    const secondHref = await secondLink.getAttribute("href");
    expect(secondHref).toMatch(/^#/);
    const secondId = secondHref!.slice(1);
    expect(await page.locator(`[id="${secondId}"]`).count()).toBe(1);
    await secondLink.click();
    await expect(page).toHaveURL(new RegExp(`#${secondId}$`));
    await expect(toc.locator(`a[href="#${secondId}"]`)).toHaveAttribute("aria-current", "location");

    await page.evaluate((id) => document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "instant" }), secondId);
    await page.waitForTimeout(100);
    await expect(toc.locator(`a[href="#${secondId}"]`)).toHaveAttribute("aria-current", "location");

    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/blog/the-future-of-technology-when-software-starts-to-think-and-act");
    await expect(page.locator(".toc-toggle")).toBeVisible();
    await expect(page.locator(".toc-title")).toBeHidden();
    await page.locator(".toc-toggle").click();
    await expect(page.locator(".toc")).toHaveClass(/toc--open/);
    await expect(page.locator(".toc ol")).toBeVisible();
    await page.locator(".toc a").nth(1).click();
    await expect(page.locator(".toc")).not.toHaveClass(/toc--open/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("public homepage keeps its primary navigation and metadata", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Home" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Blog" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Topics" }).first()).toBeVisible();
    await expect(page).toHaveTitle(/Gulshan Kumar/);
  });
});

test.describe("private route protection", () => {
  test("logged-out users cannot access dashboard or editor", async ({ page }) => {
    await page.goto("/author");
    await expect(page).toHaveURL(/\/author\/login$/);
    await page.goto("/author/editor");
    await expect(page).toHaveURL(/\/author\/login$/);
    await page.goto("/author/analytics");
    await expect(page).toHaveURL(/\/author\/login$/);
  });

  for (const width of [320, 375, 768, 1024, 1440]) {
    test(`login and homepage remain overflow-free at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/author/login");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.goto("/");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }

  test("login form rejects invalid credentials without exposing the workspace", async ({ page }) => {
    await page.goto("/author/login");
    await page.getByLabel("USERNAME").fill("invalid-user");
    await page.getByLabel("PASSWORD").fill("invalid-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator(".form-error").first()).toContainText(/authentication|invalid|unable|incorrect/i);
    await expect(page).toHaveURL(/\/author\/login$/);
  });
});

test.describe("authenticated Author Studio workflow", () => {
  test.skip(!authenticated, "Set E2E_AUTHOR_USERNAME and E2E_AUTHOR_PASSWORD for authenticated staging coverage.");

  test.beforeEach(async ({ page }) => {
    await page.goto("/author/login");
    await page.getByLabel("USERNAME").fill(username!);
    await page.getByLabel("PASSWORD").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/author$/);
  });

  test("exact legacy published editor path loads without client exceptions", async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || "failed"}`));
    const requestedPath = "content/blog/ai/agentic-ai-explained.mdx";
    await page.goto(`/author/editor?path=${encodeURIComponent(requestedPath)}`);
    await expect(page.getByLabel("Title")).toHaveValue("Agentic AI Explained: How AI Agents Think, Use Tools, and Complete Tasks");
    await expect(page.getByLabel("Slug")).toHaveValue("agentic-ai-explained");
    await expect(page.getByLabel("Category")).toHaveValue("ai");
    await expect(page.getByRole("spinbutton", { name: "Reading time in minutes" })).toHaveValue("14");
    await expect(page.getByRole("combobox", { name: "Difficulty" })).toHaveValue("Intermediate");
    await expect(page.getByRole("heading", { name: "Article quality" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save draft" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Validate" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();
    await expect(page.locator(".author-topbar")).toBeVisible();
    const coverState = await page.locator(".cover-upload").evaluate((element) => { const image = element.querySelector("img"); return { loaded: Boolean(image && image.complete && image.naturalWidth > 0), fallback: Boolean(element.querySelector(".cover-upload-fallback")) }; });
    expect(coverState.loaded || coverState.fallback).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });

  test("editor API keeps exact legacy path and structured error statuses", async ({ page }) => {
    const exact = await page.request.get(`/api/author/articles?path=${encodeURIComponent("content/blog/ai/agentic-ai-explained.mdx")}`);
    expect(exact.status()).toBe(200);
    const body = await exact.json();
    expect(body.path).toBe("content/blog/ai/agentic-ai-explained.mdx");
    expect(body.input).toMatchObject({ title: expect.stringContaining("Agentic AI Explained"), slug: "agentic-ai-explained", category: "ai", readingTime: "14", difficulty: "Intermediate", coverImage: "/images/articles/agentic-ai-explained.png" });
    expect(typeof body.input.content).toBe("string");
    const invalid = await page.request.get("/api/author/articles?path=content%2Fprivate%2Fsecrets.mdx");
    expect(invalid.status()).toBe(400);
    expect((await invalid.json()).error).toBeTruthy();
    const missing = await page.request.get("/api/author/articles?path=content%2Fblog%2Fai%2Fmissing-editor-regression.mdx");
    expect(missing.status()).toBe(404);
    expect((await missing.json()).error).toBeTruthy();
  });

  test("invalid editor path renders a normal private error state", async ({ page }) => {
    await page.goto("/author/editor?path=content%2Fprivate%2Fsecrets.mdx");
    await expect(page.getByRole("heading", { name: "Unable to open article" })).toBeVisible();
    await expect(page.getByText(/Only article MDX files can be opened/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to articles" })).toBeVisible();
    await expect(page.locator("text=Application error: a client-side exception")).toHaveCount(0);
  });

  test("dashboard filters and keyboard search work", async ({ page }) => {
    await expect(page.getByText("Drafts").first()).toBeVisible();
    await expect(page.getByText("Published").first()).toBeVisible();
    const search = page.getByRole("textbox", { name: "Search articles" });
    await search.fill("Agentic");
    await expect(page.getByText(/Agentic AI Explained/i).first()).toBeVisible();
    await search.press("Escape");
    await expect(search).toHaveValue("");
    await page.getByRole("button", { name: "Published" }).click();
    await expect(page.getByRole("button", { name: /Agentic AI Explained/i }).first()).toBeVisible();
  });

  test("dashboard links to the separate analytics center", async ({ page }) => {
    const analyticsLink = page.getByRole("link", { name: /View analytics/i });
    await expect(analyticsLink).toBeVisible();
    await analyticsLink.click();
    await expect(page).toHaveURL(/\/author\/analytics$/);
    await expect(page.getByRole("heading", { name: "Analytics Center" })).toBeVisible();
  });

  test("dashboard stays publishing-focused with one shared private header", async ({ page }) => {
    await expect(page.locator(".author-topbar")).toHaveCount(1);
    await expect(page.locator(".author-brand-mark")).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign out/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /View Analytics/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Top search queries" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Analytics Center" })).toHaveCount(0);
  });

  test("dashboard content intelligence is derived and visible", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Content overview" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Search performance" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Content timeline" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recently updated" })).toBeVisible();
    await expect(page.getByText(/Analytics data is not connected yet/i)).toBeVisible();
  });

  test("taxonomy search narrows real categories and tags", async ({ page }) => {
    await page.getByRole("button", { name: /Open taxonomy/i }).click();
    await expect(page.getByText("Categories")).toBeVisible();
    const taxonomySearch = page.getByRole("textbox", { name: "Search taxonomy" });
    await taxonomySearch.fill("ai");
    await expect(page.getByText(/AI & Machine Learning/i)).toBeVisible();
    await taxonomySearch.fill("no-such-taxonomy-value");
    await expect(page.getByText(/No categories or tags match/i)).toBeVisible();
  });

  test("analytics has one shared header and returns to Author Studio", async ({ page }) => {
    await page.goto("/author/analytics");
    await expect(page.locator(".author-topbar")).toHaveCount(1);
    await expect(page.getByRole("link", { name: /Author Studio/i }).first()).toBeVisible();
    await page.getByRole("link", { name: /Author Studio/i }).first().click();
    await expect(page).toHaveURL(/\/author$/);
  });

  for (const width of [320, 375, 768, 1024, 1440]) {
    test(`analytics remains stable and overflow-free at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/author/analytics");
      await expect(page.locator(".author-topbar")).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect(page.getByRole("link", { name: /View site/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /Sign out/i })).toBeVisible();
    });
  }

  test("analytics range, refresh, source status, and mobile layout work", async ({ page }) => {
    await page.goto("/author/analytics");
    await expect(page.getByRole("heading", { name: "Analytics Center" })).toBeVisible();
    const range = page.getByRole("combobox", { name: "Analytics date range" });
    await range.selectOption("7d");
    await expect(range).toHaveValue("7d");
    await expect(page.getByRole("button", { name: /Refresh data|Refreshing/i })).toBeVisible();
    await expect(page.getByText(/Google Search Console/i).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("engineering editor related links stay bounded and wrap long titles", async ({ page }) => {
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/author/editor?path=content%2Fblog%2Fengineering%2Fdesigning-for-failure-in-small-systems.mdx");
      const relatedPanel = page.locator("section.author-panel").filter({ has: page.getByRole("heading", { name: "Related articles" }) });
      const list = page.locator(".related-editorial-list");
      await expect(list).toBeVisible();
      const panelBox = await relatedPanel.boundingBox();
      const links = list.locator(":scope > a");
      expect(await links.count()).toBeGreaterThan(0);
      for (let index = 0; index < await links.count(); index += 1) {
        const link = links.nth(index);
        const linkBox = await link.boundingBox();
        const title = link.locator("strong");
        const metadata = link.locator("small");
        const icon = link.locator("svg");
        expect(panelBox).not.toBeNull();
        expect(linkBox).not.toBeNull();
        expect((linkBox?.x || 0) + (linkBox?.width || 0)).toBeLessThanOrEqual((panelBox?.x || 0) + (panelBox?.width || 0) + 1);
        await expect(title).toBeVisible();
        await expect(metadata).toBeVisible();
        expect(await title.evaluate((element) => getComputedStyle(element).display)).toBe("block");
        expect(await title.evaluate((element) => getComputedStyle(element).whiteSpace)).toBe("normal");
        expect(await metadata.evaluate((element) => getComputedStyle(element).display)).toBe("block");
        expect(await metadata.evaluate((element) => getComputedStyle(element).whiteSpace)).toBe("normal");
        expect(await icon.evaluate((element) => ({ width: getComputedStyle(element).width, flex: getComputedStyle(element).flexShrink }))).toMatchObject({ width: "14px", flex: "0" });
      }
      const overflow = await page.evaluate(() => ({ document: document.documentElement.scrollWidth <= window.innerWidth, body: document.body.scrollWidth <= window.innerWidth }));
      expect(overflow.document).toBe(true);
      expect(overflow.body).toBe(true);
    }
  });

  test("editor quality checklist and metrics are informational", async ({ page }) => {
    await page.getByRole("button", { name: /New article/i }).click();
    await expect(page.getByRole("heading", { name: "Article quality" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Publishing checklist" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Article metrics" })).toBeVisible();
    await expect(page.getByText(/Description guidance: approximately 120–160 characters/i)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("metadata controls are controlled, numeric, and keyboard accessible", async ({ page }) => {
    await page.getByRole("button", { name: /New article/i }).click();
    const difficulty = page.getByRole("combobox", { name: "Difficulty" });
    await difficulty.selectOption("Beginner");
    await expect(difficulty).toHaveValue("Beginner");
    await difficulty.selectOption("Intermediate");
    await expect(difficulty).toHaveValue("Intermediate");
    await difficulty.selectOption("Advanced");
    await expect(difficulty).toHaveValue("Advanced");
    const readingTime = page.getByRole("spinbutton", { name: "Reading time in minutes" });
    await expect(readingTime).toHaveValue("1");
    await page.getByRole("button", { name: "Increase reading time" }).click();
    await expect(readingTime).toHaveValue("2");
    await page.getByRole("button", { name: "Decrease reading time" }).click();
    await expect(readingTime).toHaveValue("1");
    await expect(page.getByRole("button", { name: "Decrease reading time" })).toBeDisabled();
    await readingTime.fill("6");
    await expect(readingTime).toHaveValue("6");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("revision history exposes a working restore action after inspection", async ({ page }) => {
    await page.getByRole("button", { name: /Agentic AI Explained/i }).first().click();
    await page.getByRole("button", { name: /Open revision history/i }).click();
    const revision = page.locator(".revision-item").first();
    if (await revision.count()) {
      await revision.click();
      await expect(page.getByRole("button", { name: "Restore this revision" })).toBeVisible();
    } else {
      await expect(page.getByText(/No saved revisions were found/i)).toBeVisible();
    }
  });

  test("published article opens Share Studio without social publishing", async ({ page }) => {
    await page.getByRole("button", { name: /Agentic AI Explained/i }).first().click();
    await expect(page.getByRole("button", { name: "Share article" })).toBeVisible();
    await page.getByRole("button", { name: "Share article" }).click();
    await expect(page.getByRole("heading", { name: "Share this article" })).toBeVisible();
    await expect(page.getByText(/Nothing is posted automatically/i)).toBeVisible();
    for (const label of ["X", "LinkedIn", "WhatsApp", "Telegram", "Facebook", "Reddit", "Email"]) {
      await expect(page.getByRole("tab", { name: label })).toBeVisible();
    }
    const copy = page.getByRole("button", { name: /Copy post|Copied/ });
    await copy.click();
    await expect(page.getByRole("status")).toContainText(/copied|unable/i);
    await page.getByRole("tab", { name: "LinkedIn" }).click();
    await expect(page.getByLabel("LinkedIn post")).toBeEditable();
    await page.getByRole("button", { name: "Regenerate" }).click();
  });

  test("incomplete new draft recovers locally after editor reload", async ({ page }) => {
    await page.getByRole("button", { name: /New article/i }).click();
    await page.getByLabel("Title").fill(`E2E recovery draft ${Date.now()}`);
    await page.goto("/author/editor");
    await expect(page.getByRole("status")).toContainText(/Saved locally|Unsaved changes/i);
    await expect(page.getByLabel("Title")).toHaveValue(/E2E recovery draft/);
  });

  test("logout returns to login and re-protects private routes", async ({ page }) => {
    await page.getByRole("button", { name: /Sign out/i }).click();
    await expect(page).toHaveURL(/\/author\/login$/);
    await page.goto("/author");
    await expect(page).toHaveURL(/\/author\/login$/);
  });
});


test.describe("unified content management", () => {
  test("projects and topics APIs remain protected when logged out", async ({ request }) => {
    const projects = await request.get("/api/author/projects");
    const topics = await request.get("/api/author/topics");
    expect(projects.status()).toBe(401);
    expect(topics.status()).toBe(401);
  });

  test("content-type entry URLs remain protected when logged out", async ({ page }) => {
    await page.goto("/author?type=projects");
    await expect(page).toHaveURL(/\/author\/login$/);
    await page.goto("/author?type=topics");
    await expect(page).toHaveURL(/\/author\/login$/);
  });

  test.skip(!authenticated, "Set E2E_AUTHOR_USERNAME and E2E_AUTHOR_PASSWORD for authenticated content-type coverage");
  test("authenticated Author Studio switches between Blog, Projects, and Topics without stale state or public overflow", async ({ page }) => {
    await page.goto("/author");
    await expect(page.getByRole("link", { name: "Blog", exact: true }).first()).toHaveAttribute("aria-current", "page");
    await page.getByRole("link", { name: "Projects", exact: true }).first().click();
    await expect(page).toHaveURL(/\/author\?type=projects$/);
    await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "New project" })).toBeVisible();
    await page.getByRole("link", { name: "Topics", exact: true }).first().click();
    await expect(page).toHaveURL(/\/author\?type=topics$/);
    await expect(page.getByRole("heading", { name: "Topics", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "New topic" })).toBeVisible();
    await expect(page.getByLabel("Search topics")).toBeVisible();
    await expect(page.getByLabel("Search projects")).toHaveCount(0);
    await page.getByRole("link", { name: "Blog", exact: true }).first().click();
    await expect(page).toHaveURL(/\/author$/);
    await expect(page.getByRole("heading", { name: "Author Studio", exact: true })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/author\?type=topics$/);
    await expect(page.getByRole("heading", { name: "Topics", exact: true })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/author\?type=projects$/);
    await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(/\/author\?type=topics$/);
    await expect(page.getByRole("heading", { name: "Topics", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Topics", exact: true })).toBeVisible();
    for (const width of [320, 375, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });

  test.skip(!authenticated, "Set E2E_AUTHOR_USERNAME and E2E_AUTHOR_PASSWORD for authenticated create-form coverage");
  test("Project and Topic creation forms validate and cancel without writing", async ({ page }) => {
    await page.goto("/author?type=projects");
    await page.getByRole("button", { name: "New project" }).click();
    await expect(page.getByText("New project", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Create project" })).toBeVisible();
    await page.getByLabel("Project name").fill("Invalid project");
    await page.getByLabel("Slug").fill("Bad Slug");
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByRole("alert")).toContainText(/lowercase letters/i);
    await page.getByRole("button", { name: "Cancel", exact: true }).first().click();
    await expect(page.getByRole("button", { name: "Create project" })).toHaveCount(0);
    await page.getByRole("link", { name: "Topics", exact: true }).first().click();
    await page.getByRole("button", { name: "New topic" }).click();
    await expect(page.getByText("New topic", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Create topic" })).toBeVisible();
    await page.getByLabel("Topic name").fill("Invalid topic");
    await page.getByLabel("Slug").fill("Bad Slug");
    await page.getByRole("button", { name: "Create topic" }).click();
    await expect(page.getByRole("alert")).toContainText(/lowercase letters/i);
    await page.getByRole("button", { name: "Cancel", exact: true }).first().click();
    await expect(page.getByRole("button", { name: "Create topic" })).toHaveCount(0);
  });
});

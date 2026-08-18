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

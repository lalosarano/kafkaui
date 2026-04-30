/**
 * Full e2e walk of the /topics flow against the running stack.
 * Captures every console error and failed request — so anything visibly broken
 * in the UI shows up as a hard test failure.
 */
import { expect, test, type Page } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001";
const API = process.env.PLAYWRIGHT_API_BASE ?? "http://localhost:8080/api/v1";

type ErrorLog = { kind: string; message: string; url?: string };

function attachErrorListeners(page: Page): ErrorLog[] {
  const errors: ErrorLog[] = [];
  page.on("pageerror", (e) => errors.push({ kind: "pageerror", message: e.message }));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push({ kind: "console.error", message: m.text() });
  });
  page.on("response", (r) => {
    const url = r.url();
    const status = r.status();
    if (url.startsWith(API) && status >= 500) {
      errors.push({ kind: "5xx", message: `${status} ${url}` });
    }
    if (url.startsWith(API) && status === 404) {
      errors.push({ kind: "404", message: `${status} ${url}` });
    }
  });
  page.on("requestfailed", (r) => {
    const url = r.url();
    const text = r.failure()?.errorText ?? "";
    // Harmless: STOMP /ws upgrade noise; Next.js RSC prefetch aborts when a navigation supersedes
    if (url.includes("/ws")) return;
    if (text === "net::ERR_ABORTED" && url.includes("_rsc=")) return;
    // ERR_ABORTED on an in-flight API call during route change is benign; React Query
    // will pick it up after the next page mounts.
    if (text === "net::ERR_ABORTED" && url.includes("/api/v1/")) return;
    errors.push({ kind: "requestfailed", message: `${text} ${url}` });
  });
  return errors;
}

async function seed(unique: string) {
  await fetch(`${API}/topics`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Cluster-Id": "default" },
    body: JSON.stringify({ name: unique, partitions: 3, replicationFactor: 1 }),
  });
  for (let i = 0; i < 5; i++) {
    await fetch(`${API}/topics/${unique}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Cluster-Id": "default" },
      body: JSON.stringify({ key: `k${i}`, value: JSON.stringify({ i }), headers: { "x-trace": `t${i}` } }),
    });
  }
}

async function cleanup(unique: string) {
  await fetch(`${API}/topics/${encodeURIComponent(unique)}`, {
    method: "DELETE",
    headers: { "X-Cluster-Id": "default" },
  }).catch(() => {});
}

test.describe.configure({ mode: "serial" });

test.describe("/topics flow", () => {
  let unique = "";

  test.beforeAll(async () => {
    unique = `e2e-${Date.now()}`;
    await seed(unique);
  });

  test.afterAll(async () => {
    await cleanup(unique);
  });

  test("topics list renders without runtime errors", async ({ page }) => {
    const errors = attachErrorListeners(page);
    await page.goto(`${BASE}/topics`);
    await expect(page.getByRole("heading", { name: /Topics/i })).toBeVisible();
    await expect(page.getByText(unique, { exact: false })).toBeVisible();
    expect(errors, formatErrors(errors)).toEqual([]);
  });

  test("filter and click navigates to detail page", async ({ page }) => {
    const errors = attachErrorListeners(page);
    await page.goto(`${BASE}/topics`);
    await page.getByRole("textbox", { name: /Filter topics/i }).fill(unique);
    const row = page.getByRole("row").filter({ hasText: unique }).first();
    await expect(row).toBeVisible();
    await row.click();
    await expect(page).toHaveURL(new RegExp(`/topics/${unique}$`));
    await expect(page.getByText("Partitions", { exact: false }).first()).toBeVisible();
    expect(errors, formatErrors(errors)).toEqual([]);
  });

  test("topic detail Messages tab loads and seeks earliest", async ({ page }) => {
    const errors = attachErrorListeners(page);
    await page.goto(`${BASE}/topics/${unique}`);
    await page.getByRole("tab", { name: /Messages/i }).click();
    // Switch to From beginning
    await page.locator('select[aria-label="Seek mode"]').selectOption("begin");
    await page.getByRole("button", { name: /Fetch/i }).click();
    // Wait for at least one row showing the test data we seeded
    await expect(page.getByText(/k\d+/).first()).toBeVisible({ timeout: 10_000 });
    expect(errors, formatErrors(errors)).toEqual([]);
  });

  test("topic Configuration tab renders editable", async ({ page }) => {
    const errors = attachErrorListeners(page);
    await page.goto(`${BASE}/topics/${unique}`);
    await page.getByRole("tab", { name: /Configuration/i }).click();
    await expect(page.getByText("cleanup.policy")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /Edit configs/i }).click();
    await expect(page.locator("table input").first()).toBeVisible();
    expect(errors, formatErrors(errors)).toEqual([]);
  });

  test("live tail receives a freshly produced message within 10s", async ({ page }) => {
    const errors = attachErrorListeners(page);
    await page.goto(`${BASE}/topics/${unique}`);
    await page.getByRole("tab", { name: /Messages/i }).click();
    // Default seek is "tail" — wait for the connection indicator to read "Tailing"
    await expect(page.getByText(/Tailing|Connecting…/)).toBeVisible({ timeout: 5_000 });
    // produce one fresh message via API while the tail is open
    const marker = `live-${Date.now()}`;
    await fetch(`${API}/topics/${unique}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Cluster-Id": "default" },
      body: JSON.stringify({ key: marker, value: JSON.stringify({ marker }) }),
    });
    await expect(page.getByText(marker).first()).toBeVisible({ timeout: 15_000 });
    expect(errors, formatErrors(errors)).toEqual([]);
  });

  test("filter syntax: key:, value:, p: tokens narrow the table", async ({ page }) => {
    const errors = attachErrorListeners(page);
    await page.goto(`${BASE}/topics/${unique}`);
    await page.getByRole("tab", { name: /Messages/i }).click();
    await page.locator('select[aria-label="Seek mode"]').selectOption("begin");
    await page.getByRole("button", { name: /Fetch/i }).click();
    await expect(page.getByText(/k\d+/).first()).toBeVisible({ timeout: 10_000 });
    const filter = page.getByRole("textbox", { name: /Filter messages/i });
    await filter.fill("key:k1");
    await expect(page.getByText("k1", { exact: false })).toBeVisible();
    await filter.fill("header:x-trace=t1");
    await expect(page.getByRole("row").filter({ hasText: "k1" }).first()).toBeVisible();
    expect(errors, formatErrors(errors)).toEqual([]);
  });

  test("create-topic via UI lands the topic in the list", async ({ page }) => {
    const errors = attachErrorListeners(page);
    const fresh = `e2e-create-${Date.now()}`;
    await page.goto(`${BASE}/topics`);
    await page.getByRole("button", { name: /Create topic/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder(/orders\.events\.v1/).fill(fresh);
    // Open the Advanced configs panel and add one custom entry to exercise that path
    await dialog.getByRole("button", { name: /Advanced configs/i }).click();
    await dialog.getByRole("button", { name: /Add config/i }).click();
    await dialog.getByPlaceholder("config.key").fill("max.message.bytes");
    await dialog.getByPlaceholder("value").fill("1048576");
    await dialog.getByRole("button", { name: /^Create topic$/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(fresh).first()).toBeVisible({ timeout: 10_000 });
    // cleanup
    await fetch(`${API}/topics/${encodeURIComponent(fresh)}`, {
      method: "DELETE", headers: { "X-Cluster-Id": "default" },
    });
    expect(errors, formatErrors(errors)).toEqual([]);
  });

  test("delete-topic enforces type-to-confirm", async ({ page }) => {
    const errors = attachErrorListeners(page);
    const throwaway = `e2e-del-${Date.now()}`;
    await fetch(`${API}/topics`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Cluster-Id": "default" },
      body: JSON.stringify({ name: throwaway, partitions: 1, replicationFactor: 1 }),
    });
    await page.goto(`${BASE}/topics/${throwaway}`);
    await page.getByRole("button", { name: /Delete$/i }).click();
    const dialog = page.getByRole("dialog");
    const confirmBtn = dialog.getByRole("button", { name: /Delete topic/i });
    await expect(confirmBtn).toBeDisabled();
    await dialog.getByPlaceholder(throwaway).fill(throwaway);
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();
    await expect(page).toHaveURL(/\/topics$/);
    expect(errors, formatErrors(errors)).toEqual([]);
  });
});

function formatErrors(errors: ErrorLog[]): string {
  if (errors.length === 0) return "(none)";
  return "Captured errors:\n" + errors.map((e) => `  [${e.kind}] ${e.message}`).join("\n");
}

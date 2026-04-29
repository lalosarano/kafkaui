import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Smoke", () => {
  test("dashboard → topics → topic detail loads without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto("/topics");
    await expect(page.getByRole("heading", { name: /Topics/i })).toBeVisible();

    // best-effort: only navigate to the first topic if any exist
    const firstRow = page.locator("table tbody tr").first();
    if (await firstRow.count()) {
      const name = await firstRow.locator("td").nth(0).innerText();
      if (name) {
        await firstRow.click();
        await expect(page.getByText(/Partitions/i).first()).toBeVisible();
      }
    }

    expect(errors, `console errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("dashboard has no critical a11y violations", async ({ page }) => {
    await page.goto("/");
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const critical = result.violations.filter((v) => v.impact === "critical");
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });
});

import { expect, test } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001";
const API = process.env.PLAYWRIGHT_API_BASE ?? "http://localhost:8080/api/v1";

test("live tail keeps receiving past 200 messages", async ({ page }) => {
  const topic = `tail-stress-${Date.now()}`;
  await fetch(`${API}/topics`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Cluster-Id": "default" },
    body: JSON.stringify({ name: topic, partitions: 3, replicationFactor: 1 }),
  });

  await page.goto(`${BASE}/topics/${topic}`);
  await page.getByRole("tab", { name: /Messages/i }).click();
  // Wait for the tail to be live
  await expect(page.getByText("Tailing")).toBeVisible({ timeout: 10_000 });

  async function produce(marker: string, count: number) {
    const ops = [];
    for (let i = 0; i < count; i++) {
      ops.push(fetch(`${API}/topics/${topic}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Cluster-Id": "default" },
        body: JSON.stringify({ key: `${marker}-${i}`, value: JSON.stringify({ marker, i }) }),
      }));
    }
    await Promise.all(ops);
  }

  // Burst 1 — under 200
  await produce("burst-A", 50);
  await expect(page.getByText("burst-A-0").first()).toBeVisible({ timeout: 15_000 });

  // Burst 2 — push past the 200 buffer
  await produce("burst-B", 220);
  // After 50 + 220 = 270 messages, the buffer should rotate. Most recent is burst-B-219.
  await expect(page.getByText("burst-B-219").first()).toBeVisible({ timeout: 20_000 });

  // Burst 3 — verify the *next* message after the buffer is full also appears
  await produce("burst-C", 5);
  await expect(page.getByText("burst-C-4").first()).toBeVisible({ timeout: 20_000 });

  // cleanup
  await fetch(`${API}/topics/${encodeURIComponent(topic)}`, {
    method: "DELETE", headers: { "X-Cluster-Id": "default" },
  });
});

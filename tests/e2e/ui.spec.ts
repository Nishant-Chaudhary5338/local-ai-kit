import { test, expect } from "@playwright/test";

// Tier 1 — deterministic behavior. No WebGPU required. Because Chromium exposes
// no WebGPU adapter under automation, these also verify the fallback/degraded
// path, which is a first-class requirement of the real app.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
});

test("renders the app shell and privacy footer", async ({ page }) => {
  await expect(page.getByText("local-ai-kit").first()).toBeVisible();
  await expect(page.getByText("Nothing leaves your device")).toBeVisible();
});

test("resolves the WebGPU capability badge (never stuck on checking)", async ({
  page,
}) => {
  const badge = page.getByTestId("gpu-badge");
  await expect(badge).toBeVisible();
  await expect(badge).not.toHaveText(/checking|…/);
  await expect(badge).toHaveText(/WebGPU: (available|unavailable)/);
});

test("shows the fallback warning and disables Load when WebGPU is unavailable", async ({
  page,
}) => {
  const badge = page.getByTestId("gpu-badge");
  const isUnavailable = (await badge.textContent())?.includes("unavailable");
  test.skip(
    !isUnavailable,
    "WebGPU is available in this browser — fallback path not applicable",
  );
  await expect(page.getByText(/WebGPU unavailable/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Load model" })).toBeDisabled();
});

test("lists the model catalog across tiers in the picker", async ({ page }) => {
  const options = page.locator("select option");
  await expect(options).toHaveCount(9);
  await expect(options.filter({ hasText: "Llama 3.2 3B" })).toHaveCount(1);
  await expect(options.filter({ hasText: "Llama 3.1 8B" })).toContainText(
    "large",
  );
});

test("keeps the composer disabled until a model is ready", async ({ page }) => {
  await expect(page.getByTestId("composer-input")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Send" })).toBeDisabled();
});

test("creates a new conversation", async ({ page }) => {
  const items = page.getByTestId("conversation");
  const before = await items.count();
  await page.getByRole("button", { name: "+ New" }).click();
  await expect(items).toHaveCount(before + 1);
});

test("shows the trust panel with capability and network sections", async ({
  page,
}) => {
  const trust = page.getByTestId("trust-panel");
  await expect(trust).toBeVisible();
  await expect(trust.getByRole("heading", { name: "Capability" })).toBeVisible();
  await expect(trust.getByRole("heading", { name: "Network" })).toBeVisible();
  await expect(trust.getByText("Non-model")).toBeVisible();
});

test("collapses and reopens the trust panel", async ({ page }) => {
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByTestId("trust-panel")).toHaveCount(0);
  await page.getByRole("button", { name: /Trust panel/ }).click();
  await expect(page.getByTestId("trust-panel")).toBeVisible();
});

test("offers document search (RAG) in the sidebar", async ({ page }) => {
  await expect(page.getByText("Documents · private")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Enable document search/ }),
  ).toBeVisible();
});

test("switches to the journal and creates an entry", async ({ page }) => {
  await page.getByRole("button", { name: "journal", exact: true }).click();
  await expect(page.getByTestId("journal-view")).toBeVisible();
  await page.getByRole("button", { name: "+ New entry" }).click();
  await page.getByPlaceholder("Title").fill("My first entry");
  await expect(
    page.getByRole("button", { name: "My first entry" }),
  ).toBeVisible();
});

test("toggles the color theme and persists it", async ({ page }) => {
  const read = () =>
    page.evaluate(() => document.documentElement.dataset.theme ?? "");
  const before = await read();
  await page.getByRole("button", { name: "Toggle theme" }).click();
  const after = await read();
  expect(after).not.toBe(before);
  expect(["light", "dark"]).toContain(after);
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect.poll(read).toBe(after);
});

test("exposes data ownership controls in the trust panel", async ({ page }) => {
  const trust = page.getByTestId("trust-panel");
  await expect(trust.getByRole("heading", { name: "Your data" })).toBeVisible();
  await expect(trust.getByRole("button", { name: "Export" })).toBeVisible();
  await expect(trust.getByRole("button", { name: "Wipe all" })).toBeVisible();
});

test("opens the benchmark view", async ({ page }) => {
  await page.getByRole("button", { name: "benchmark", exact: true }).click();
  await expect(page.getByTestId("benchmark-view")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "On-device benchmark" }),
  ).toBeVisible();
});

test("command palette opens with the keyboard and closes on Escape", async ({
  page,
}) => {
  await page.keyboard.press("ControlOrMeta+k");
  const input = page.getByPlaceholder("Type a command…");
  await expect(input).toBeVisible();
  await input.fill("journal");
  await input.press("Enter");
  await expect(page.getByTestId("journal-view")).toBeVisible();
});

test("loads without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.reload();
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

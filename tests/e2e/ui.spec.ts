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
  const badge = page.locator(".badge");
  await expect(badge).toBeVisible();
  await expect(badge).not.toHaveText(/checking|…/);
  await expect(badge).toHaveText(/WebGPU: (available|unavailable)/);
});

test("shows the fallback panel and disables Load when WebGPU is unavailable", async ({
  page,
}) => {
  const badge = page.locator(".badge");
  const isUnavailable = (await badge.textContent())?.includes("unavailable");
  test.skip(
    !isUnavailable,
    "WebGPU is available in this browser — fallback path not applicable",
  );
  await expect(page.locator(".panel--warn")).toBeVisible();
  await expect(page.getByRole("button", { name: "Load model" })).toBeDisabled();
});

test("lists the model catalog across tiers in the picker", async ({ page }) => {
  const options = page.locator("select option");
  await expect(options).toHaveCount(7);
  await expect(options.filter({ hasText: "Llama 3.2 3B" })).toHaveCount(1);
  await expect(options.filter({ hasText: "Llama 3.1 8B" })).toContainText(
    "large",
  );
});

test("keeps the composer disabled until a model is ready", async ({ page }) => {
  await expect(page.locator(".composer textarea")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Send" })).toBeDisabled();
});

test("creates a new conversation", async ({ page }) => {
  const items = page.locator(".conv");
  const before = await items.count();
  await page.getByRole("button", { name: "+ New" }).click();
  await expect(items).toHaveCount(before + 1);
});

test("shows the trust panel with capability and network sections", async ({
  page,
}) => {
  const trust = page.locator(".trust");
  await expect(trust).toBeVisible();
  await expect(trust.getByRole("heading", { name: "Capability" })).toBeVisible();
  await expect(trust.getByRole("heading", { name: "Network" })).toBeVisible();
  // Nothing outbound should be flagged non-model before any model load.
  await expect(trust.locator(".trust__row", { hasText: "Non-model" })).toContainText(
    "0",
  );
});

test("collapses and reopens the trust panel", async ({ page }) => {
  await page.locator(".trust__close").click();
  await expect(page.locator(".trust")).toHaveCount(0);
  await page.getByRole("button", { name: /Trust panel/ }).click();
  await expect(page.locator(".trust")).toBeVisible();
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

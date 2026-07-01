import { test, expect } from "@playwright/test";

// Tier 1 — deterministic behavior. No WebGPU required. Because Chromium exposes
// no WebGPU adapter under automation, these also verify the fallback/degraded
// path, which is a first-class requirement of the real app.

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
});

test("renders the header and tagline", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "local-ai-kit" })).toBeVisible();
  await expect(page.getByText("100% in-browser inference")).toBeVisible();
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

test("lists all spike models in the picker", async ({ page }) => {
  const options = page.locator("select option");
  await expect(options).toHaveCount(4);
  await expect(options).toContainText([
    "Qwen2.5 0.5B",
    "Llama 3.2 1B",
    "Llama 3.2 3B",
    "Phi-3.5 mini (1k)",
  ]);
});

test("keeps Send disabled until a model is ready", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Send" })).toBeDisabled();
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

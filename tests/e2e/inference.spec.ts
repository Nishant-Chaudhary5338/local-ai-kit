import { test, expect } from "@playwright/test";

// Tier 2 — real end-to-end inference. Self-skips unless the browser exposes a
// working WebGPU adapter, so it is CI-safe. To actually run it, drive a
// WebGPU-capable browser (see README) — it downloads a small model, streams a
// reply, and asserts a real decode tokens/sec.

test("streams a real reply and reports tokens/sec on a WebGPU browser", async ({
  page,
}) => {
  test.setTimeout(300_000); // first load downloads model weights

  await page.goto("/");
  const hasAdapter = await page.evaluate(async () => {
    if (!("gpu" in navigator) || !navigator.gpu) return false;
    const adapter = await navigator.gpu.requestAdapter().catch(() => null);
    return adapter !== null;
  });
  test.skip(
    !hasAdapter,
    "No WebGPU adapter under automation — run against a WebGPU-capable browser",
  );

  // Smallest model keeps the download fast.
  await page.selectOption("select", { label: /Llama 3.2 1B/ });
  await page.getByRole("button", { name: "Load model" }).click();

  await expect(page.getByText("Model ready.")).toBeVisible({ timeout: 240_000 });

  await page
    .getByTestId("composer-input")
    .fill("Say hello in exactly three words.");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByTestId("msg-assistant").last()).not.toBeEmpty({
    timeout: 60_000,
  });

  const stats = page.getByText(/decode .* tok\/s/);
  await expect(stats).toBeVisible({ timeout: 60_000 });
  const statsText = (await stats.textContent()) ?? "";
  const decode = Number(statsText.match(/decode ([\d.]+) tok\/s/)?.[1] ?? "0");
  expect(decode).toBeGreaterThan(0);
});

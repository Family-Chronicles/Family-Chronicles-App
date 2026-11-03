import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("switches the language and remembers it", async ({ page }) => {
	await login(page);
	await expect(
		page.getByRole("link", { name: "Personen" }).first(),
	).toBeVisible();

	await page.locator("#locale").selectOption("en");
	await expect(
		page.getByRole("link", { name: "People" }).first(),
	).toBeVisible();
	await expect(page.locator("html")).toHaveAttribute("lang", "en");

	await page.reload();
	await expect(
		page.getByRole("link", { name: "People" }).first(),
	).toBeVisible();
	await page.locator("#locale").selectOption("de");
	await expect(
		page.getByRole("link", { name: "Personen" }).first(),
	).toBeVisible();
});

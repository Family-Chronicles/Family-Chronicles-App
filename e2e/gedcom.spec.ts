import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { expect, test } from "@playwright/test";
import { login, unique } from "./helpers";

test("imports a GEDCOM file and exports the data again", async ({ page }) => {
	await login(page);
	await page.goto("/#/gedcom");
	const family = unique("Import");
	await page
		.locator("#ged-file")
		.setInputFiles(path.join(__dirname, "fixtures/sample.ged"));
	await page.locator("#ged-family").fill(family);
	await page.getByRole("button", { name: "Importieren" }).click();

	const result = page.getByTestId("import-result");
	await expect(result).toContainText(
		"4 Personen und 5 Beziehungen importiert.",
	);
	await expect(result).toContainText("@I99@");

	await result.getByRole("link", { name: "Zur Familie" }).click();
	await expect(
		page.getByRole("heading", { name: `Familie ${family}` }),
	).toBeVisible();
	await expect(page.getByText("Mitglieder (4)")).toBeVisible();

	// life events and sources from the file are shown on the person page
	await page.getByRole("link", { name: /Karl Friedrich Schmidt/ }).click();
	await expect(page.getByTestId("life-events")).toContainText("Taufe");
	await expect(page.getByTestId("life-events")).toContainText("Beruf: Schmied");
	await expect(page.getByTestId("sources")).toContainText(
		"Kirchenbuch St. Lorenz",
	);

	await page.goto("/#/gedcom");
	const download = page.waitForEvent("download");
	await page.getByRole("button", { name: "Nur GEDCOM (.ged)" }).click();
	const file = await download;
	expect(file.suggestedFilename()).toMatch(/\.ged$/);
});

test("imports a zip with media and exports one", async ({ page }) => {
	await login(page);
	await page.goto("/#/gedcom");
	await page
		.locator("#ged-file")
		.setInputFiles(path.join(__dirname, "fixtures/with-media.zip"));
	await page.getByRole("button", { name: "Importieren" }).click();
	await expect(page.getByTestId("import-result")).toContainText(
		"1 Bilder und Dokumente übernommen.",
	);

	await page.goto("/#/persons");
	await page.locator("#search").fill("mathilde bildner");
	await page.getByTestId("person-list").getByRole("link").first().click();
	await page
		.getByRole("button", { name: /Portrait 1920/ })
		.first()
		.click();
	await expect
		.poll(() =>
			page
				.locator("dialog[open] img")
				.evaluate((img: HTMLImageElement) => img.naturalWidth),
		)
		.toBe(40);
	await page.keyboard.press("Escape");

	await page.goto("/#/gedcom");
	const download = page.waitForEvent("download");
	await page
		.getByRole("button", { name: "Mit Bildern und Dokumenten (ZIP)" })
		.click();
	expect((await download).suggestedFilename()).toMatch(/\.zip$/);
});

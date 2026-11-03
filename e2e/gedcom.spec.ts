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
	await page.getByRole("button", { name: "Exportieren" }).click();
	const file = await download;
	expect(file.suggestedFilename()).toMatch(/\.ged$/);
});

import { expect, test } from "@playwright/test";
import { apiPost, apiToken, login, unique } from "./helpers";

test("create a person, link relatives and show the family tree", async ({
	page,
	request,
}) => {
	const token = await apiToken(request);
	const last = unique("Schmidt");
	const father = await apiPost(request, token, "/persons", {
		FirstNames: "Karl",
		LastNames: last,
		Gender: "Male",
	});

	await login(page);
	await page.goto("/#/persons/new");
	await page.locator("#first").fill("Hans");
	await page.locator("#last").fill(last);
	await page.locator("#dob").fill("12.04.1950");
	await page.locator("#gender").selectOption("Male");
	await page.getByRole("button", { name: "+ Ereignis" }).click();
	await page.locator("#ev-type-0").selectOption("Occupation");
	await page.locator("#ev-desc-0").fill("Bäcker");
	await page.locator("#ev-place-0").fill("Fürth");
	await page.getByRole("button", { name: "+ Quelle" }).click();
	await page.locator("#src-title-0").fill("Geburtsurkunde");
	await page.getByRole("button", { name: "Speichern" }).click();
	await expect(
		page.getByRole("heading", { level: 1, name: `Hans ${last}` }),
	).toBeVisible();
	await expect(page.getByText("* 12.04.1950")).toBeVisible();
	await expect(page.getByTestId("life-events")).toContainText("Beruf: Bäcker");
	await expect(page.getByTestId("sources")).toContainText("Geburtsurkunde");

	await page.getByRole("button", { name: "+ Beziehung" }).click();
	await page.locator("#rel-person").fill(`Karl ${last}`);
	await page
		.getByRole("listbox")
		.getByRole("option")
		.first()
		.locator("button")
		.dispatchEvent("mousedown");
	await page.locator("#rel-kind").selectOption("Parent");
	await page.locator("#rel-role").fill("Vater");
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "Speichern" })
		.click();
	await expect(page.getByText("Beziehung gespeichert.")).toBeVisible();
	await expect(
		page.getByRole("link", { name: new RegExp(`Karl ${last}`) }),
	).toBeVisible();

	await page.getByRole("link", { name: "Stammbaum" }).click();
	await expect(page.getByRole("heading", { name: "Stammbaum" })).toBeVisible();
	await expect(
		page.locator(`a[href="#/persons/${father.Id}/tree"]`),
	).toBeVisible();
});

test("viewers cannot edit or manage users", async ({ page, request }) => {
	const token = await apiToken(request);
	const email = `${unique("viewer")}@example.org`;
	await apiPost(request, token, "/users", {
		Name: "Oma Inge",
		Email: email,
		Password: "viewer-password",
		Role: "Viewer",
	});
	const person = await apiPost(request, token, "/persons", {
		FirstNames: "Anna",
		LastNames: unique("Test"),
	});

	await login(page, email, "viewer-password");
	await page.goto(`/#/persons/${person.Id}`);
	await expect(
		page.getByRole("heading", { name: "Beziehungen" }),
	).toBeVisible();
	await expect(page.getByRole("link", { name: "Bearbeiten" })).toHaveCount(0);
	await expect(page.getByRole("button", { name: "+ Beziehung" })).toHaveCount(
		0,
	);
	await page.goto("/#/users");
	await expect(page.getByText("Kein Zugriff")).toBeVisible();
});

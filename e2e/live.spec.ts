import { expect, test } from "@playwright/test";
import { apiPost, apiToken, login, unique } from "./helpers";

test("shows changes made by someone else without reloading", async ({
	page,
	request,
}) => {
	await login(page);
	await expect(page.getByTestId("live-indicator")).toHaveAttribute(
		"data-connected",
		"true",
	);
	await page.goto("/#/persons");
	await expect(
		page
			.getByTestId("person-list")
			.or(page.getByText("Noch keine Personen erfasst.")),
	).toBeVisible();

	const name = unique("Live");
	const token = await apiToken(request);
	await apiPost(request, token, "/persons", {
		FirstNames: "Paula",
		LastNames: name,
	});

	await expect(page.getByText(`Paula ${name}`)).toBeVisible();
	await expect(
		page
			.locator("#app")
			.getByText(
				"Die Daten wurden von jemand anderem geändert und neu geladen.",
			),
	).toBeVisible();
});

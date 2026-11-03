import { expect, test } from "@playwright/test";
import { apiPost, apiToken, login, unique } from "./helpers";

test("searches on the server and loads more persons on demand", async ({
	page,
	request,
}) => {
	const token = await apiToken(request);
	const family = unique("Paging");
	for (let i = 0; i < 55; i++) {
		await apiPost(request, token, "/persons", {
			FirstNames: `P${String(i).padStart(2, "0")}`,
			LastNames: family,
		});
	}

	await login(page);
	await page.goto("/#/persons");
	await page.locator("#search").fill(family.toLowerCase());
	await expect(page.getByTestId("person-count-shown")).toHaveText(
		"50 von 55 angezeigt",
	);
	await page.getByRole("button", { name: "Weitere laden" }).click();
	await expect(page.getByTestId("person-count-shown")).toHaveText(
		"55 von 55 angezeigt",
	);
	await expect(page.getByRole("button", { name: "Weitere laden" })).toHaveCount(
		0,
	);

	await page.locator("#search").fill(`p07 ${family}`);
	await expect(
		page.getByTestId("person-list").getByRole("listitem"),
	).toHaveCount(1);
});

import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const API = "http://localhost:8080/api/v1";

test("renews an expired access token with the refresh token", async ({
	page,
}) => {
	await login(page);
	// make the stored access token invalid, keep the refresh token
	await page.evaluate(() => {
		const session = JSON.parse(localStorage.getItem("fc.session")!);
		localStorage.setItem(
			"fc.session",
			JSON.stringify({ ...session, token: "expired" }),
		);
	});
	await page.reload();
	await page.goto("/#/persons");
	await expect(page.getByRole("heading", { name: "Personen" })).toBeVisible();
	await expect(page.locator("#email")).toHaveCount(0);
	const token = await page.evaluate(
		() => JSON.parse(localStorage.getItem("fc.session")!).token,
	);
	expect(token).not.toBe("expired");
});

test("logging out ends the session on the server", async ({
	page,
	request,
}) => {
	await login(page);
	const refreshToken = await page.evaluate(
		() => JSON.parse(localStorage.getItem("fc.session")!).refreshToken,
	);
	await page.getByRole("button", { name: "Abmelden" }).click();
	await expect(page.locator("#email")).toBeVisible();
	await expect
		.poll(async () =>
			(
				await request.post(`${API}/auth/refresh`, {
					data: { RefreshToken: refreshToken },
				})
			).status(),
		)
		.toBe(401);
});

test("the reset page is reachable without login and rejects invalid links", async ({
	page,
}) => {
	await page.goto("/#/reset-password?token=invalid.token");
	await expect(
		page.getByRole("heading", { name: "Neues Passwort festlegen" }),
	).toBeVisible();
	await page.locator("#reset-new").fill("new-password-123");
	await page.locator("#reset-repeat").fill("new-password-123");
	await page.getByRole("button", { name: "Passwort speichern" }).click();
	await expect(page.getByRole("alert")).toContainText(
		"ungültig oder abgelaufen",
	);
});

import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { ADMIN } from "../playwright.config";

export { ADMIN };

const API = "http://localhost:8080/api/v1";

/** Logs in through the UI */
export async function login(
	page: Page,
	email = ADMIN.email,
	password = ADMIN.password,
) {
	await page.goto("/");
	await page.locator("#email").fill(email);
	await page.locator("#password").fill(password);
	await page
		.locator("form button[type=submit], form button:not([type])")
		.click();
	await expect(page.getByTestId("live-indicator")).toBeVisible();
}

/** Token for direct API calls (to prepare data quickly) */
export async function apiToken(
	request: APIRequestContext,
	email = ADMIN.email,
	password = ADMIN.password,
) {
	const res = await request.post(`${API}/auth/login`, {
		data: { Email: email, Password: password },
	});
	expect(res.ok()).toBeTruthy();
	return (await res.json()).token as string;
}

export async function apiPost<T = { Id: string }>(
	request: APIRequestContext,
	token: string,
	path: string,
	data: object,
) {
	const res = await request.post(`${API}${path}`, {
		data,
		headers: { Authorization: `Bearer ${token}` },
	});
	expect(res.ok(), await res.text()).toBeTruthy();
	return (await res.json()) as T;
}

/** Unique name so tests do not depend on each other */
export const unique = (name: string) =>
	`${name}${Math.random().toString(36).slice(2, 7)}`;

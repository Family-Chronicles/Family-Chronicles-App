import { expect, test } from "@playwright/test";
import { ADMIN, apiPost, apiToken, login, unique } from "./helpers";

/** The second server started by playwright.config.ts */
const B = "http://localhost:8081/api/v1";

test("connects another instance and links a person there", async ({
	page,
	request,
}) => {
	// on instance B: a person, a viewer user for A and an API token for it
	const login_b = await request.post(`${B}/auth/login`, {
		data: { Email: ADMIN.email, Password: ADMIN.password },
	});
	const bToken = (await login_b.json()).token as string;
	const headers = { Authorization: `Bearer ${bToken}` };
	const name = unique("Fern");
	const greta = await (
		await request.post(`${B}/persons`, {
			headers,
			data: { FirstNames: "Greta", LastNames: name, DateOfBirth: "1888" },
		})
	).json();
	const otto = await (
		await request.post(`${B}/persons`, {
			headers,
			data: { FirstNames: "Otto", LastNames: name },
		})
	).json();
	await request.post(`${B}/relationships`, {
		headers,
		data: { PersonId: otto.Id, RelatedPersonId: greta.Id, Type: "Parent" },
	});
	const user = await (
		await request.post(`${B}/users`, {
			headers,
			data: {
				Name: "Instanz A",
				Email: `${unique("a")}@example.org`,
				Password: "password123",
				Role: "Viewer",
			},
		})
	).json();
	const apiTokenOfB = (
		await (
			await request.post(`${B}/tokens`, {
				headers,
				data: { UserId: user.Id, Name: "A" },
			})
		).json()
	).Token;

	// on instance A: a local person
	const tokenA = await apiToken(request);
	const local = await apiPost(request, tokenA, "/persons", {
		FirstNames: "Greta",
		LastNames: name,
	});

	await login(page);
	await page.getByRole("link", { name: "Föderation" }).click();
	await page.getByRole("button", { name: "+ Instanz verbinden" }).click();
	const peerName = unique("Familie B ");
	await page.locator("#peer-name").fill(peerName);
	await page.locator("#peer-url").fill("http://localhost:8081");
	await page.locator("#peer-token").fill(apiTokenOfB);
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "Verbinden" })
		.click();
	await expect(page.getByTestId("peer-list")).toContainText(peerName);
	await expect(page.getByTestId("peer-list")).toContainText("verbunden");

	await page.goto(`/#/persons/${local.Id}`);
	await page.getByRole("button", { name: "+ Verknüpfen" }).click();
	await page.locator("#link-peer").selectOption({ label: peerName });
	await page.locator("#link-search").fill(name);
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "Suchen" })
		.click();
	await page
		.getByTestId("remote-results")
		.getByRole("button", { name: new RegExp(`Greta ${name}`) })
		.click();
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "Speichern" })
		.click();
	await expect(page.getByTestId("person-links")).toContainText(`Greta ${name}`);
	await expect(page.getByTestId("person-links")).toContainText(
		"Dieselbe Person",
	);

	await page
		.getByTestId("person-links")
		.getByRole("button", { name: "Ansehen" })
		.click();
	await expect(page.getByTestId("remote-person")).toContainText("* 1888");
	await page.keyboard.press("Escape");

	// family tree on the other instance, then take over Greta's father
	await page
		.getByTestId("person-links")
		.getByRole("link", { name: "Stammbaum" })
		.click();
	await expect(page.getByTestId("remote-tree")).toContainText(`Otto ${name}`);
	await page
		.getByTestId("remote-tree")
		.getByRole("link", { name: new RegExp(`Otto ${name}`) })
		.click();
	await expect(
		page.getByRole("heading", { name: `Stammbaum: Otto ${name}` }),
	).toBeVisible();
	await page.getByRole("button", { name: "Übernehmen" }).click();
	await expect(
		page.getByRole("heading", { level: 1, name: `Otto ${name}` }),
	).toBeVisible();
	await expect(page.getByTestId("person-links")).toContainText(
		"Dieselbe Person",
	);
	await expect(page.getByTestId("sources")).toContainText(peerName);
});

test("connects both ways with a connection request", async ({
	page,
	request,
}) => {
	const bLogin = await request.post(`${B}/auth/login`, {
		data: { Email: ADMIN.email, Password: ADMIN.password },
	});
	const headers = { Authorization: `Bearer ${(await bLogin.json()).token}` };
	const user = await (
		await request.post(`${B}/users`, {
			headers,
			data: {
				Name: "Instanz A2",
				Email: `${unique("a2")}@example.org`,
				Password: "password123",
				Role: "Viewer",
			},
		})
	).json();
	const tokenOfB = (
		await (
			await request.post(`${B}/tokens`, {
				headers,
				data: { UserId: user.Id, Name: "A2" },
			})
		).json()
	).Token;

	await login(page);
	await page.goto("/#/federation");
	await page.getByRole("button", { name: "+ Instanz verbinden" }).click();
	await page.locator("#peer-name").fill(unique("Beidseitig "));
	await page.locator("#peer-url").fill("http://localhost:8081");
	await page.locator("#peer-token").fill(tokenOfB);
	await page.locator("#peer-mutual").check();
	await page.locator("#peer-message").fill("Hallo aus A");
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "Verbinden" })
		.click();
	await expect(
		page
			.locator("#app")
			.getByText("Verbindungsanfrage an die andere Instanz gesendet."),
	).toBeVisible();

	// on B the admin accepts the request
	const requests = await (
		await request.get(`${B}/federation/requests`, { headers })
	).json();
	const fromA = requests.find(
		(r: { Message: string }) => r.Message === "Hallo aus A",
	);
	expect(fromA.Name).toBe("Familie A");
	const accepted = await request.post(
		`${B}/federation/requests/${fromA.Id}/accept`,
		{ headers },
	);
	expect(accepted.status()).toBe(201);
	const peer = await accepted.json();
	const found = await request.get(
		`${B}/federation/peers/${peer.Id}/persons?q=`,
		{ headers },
	);
	expect(found.status()).toBe(200);
});

test("creates an API token and shows it once", async ({ page }) => {
	await login(page);
	await page.goto("/#/federation");
	await page.getByRole("button", { name: "+ Token erstellen" }).click();
	const label = unique("Token ");
	await page.locator("#token-name").fill(label);
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "Erstellen" })
		.click();
	await expect(page.getByTestId("created-token")).toHaveText(/^fc_/);
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "Schließen" })
		.last()
		.click();
	await expect(page.getByTestId("token-list")).toContainText(label);
});

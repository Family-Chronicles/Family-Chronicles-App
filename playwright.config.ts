import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a real server running in memory mode.
 * The server repository is expected next to this one (override with SERVER_DIR).
 */
const SERVER_DIR = process.env.SERVER_DIR ?? "../Family-Chronicles-Server";
export const ADMIN = {
	email: "admin@family-chronicles.local",
	password: "e2e-admin-password",
};

export default defineConfig({
	testDir: "e2e",
	fullyParallel: false,
	workers: 1,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
	use: {
		baseURL: "http://localhost:5173",
		trace: "retain-on-failure",
		locale: "de-DE",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: [
		{
			command: "npm run build && node dist/server.js",
			cwd: SERVER_DIR,
			url: "http://localhost:8080/api/v1/health",
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
			env: {
				DB_DRIVER: "memory",
				PORT: "8080",
				JWT_SECRET: "e2e-secret",
				ADMIN_PASSWORD: ADMIN.password,
				RATE_LIMIT_PER_MINUTE: "100000",
				UPLOAD_DIR: "/tmp/fc-e2e-uploads",
			},
		},
		{
			command: "npm run dev -- --port 5173 --strictPort",
			url: "http://localhost:5173",
			reuseExistingServer: !process.env.CI,
			timeout: 60_000,
		},
	],
});

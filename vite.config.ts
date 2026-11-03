import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	plugins: [tailwindcss(), svelte()],
	server: {
		port: 5173,
		// During development API calls are proxied to the server, so no CORS setup is needed.
		proxy: {
			"/api": {
				target: process.env.API_PROXY_TARGET ?? "http://localhost:8080",
				ws: true, // live updates (/api/v1/live)
			},
		},
	},
	test: {
		include: ["src/**/*.test.ts"],
		exclude: ["e2e/**", "node_modules/**"],
	},
});

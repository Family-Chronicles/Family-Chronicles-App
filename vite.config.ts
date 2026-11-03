import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	plugins: [tailwindcss(), svelte()],
	server: {
		port: 5173,
		// During development API calls are proxied to the server, so no CORS setup is needed.
		proxy: {
			"/api": process.env.API_PROXY_TARGET ?? "http://localhost:8080",
		},
	},
	test: {
		include: ["src/**/*.test.ts"],
	},
});

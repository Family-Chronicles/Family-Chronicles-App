<script lang="ts">
	import { href } from "../lib/router";
</script>

<div class="py-16 text-center">
	<h1 class="text-3xl font-semibold text-bark-900">Kein Zugriff</h1>
	<p class="mt-2 text-stone-600">
		Für diese Seite fehlen dir die nötigen Rechte.
	</p>
	<a class="btn-primary mt-6" href={href("/")}>Zur Übersicht</a>
</div>

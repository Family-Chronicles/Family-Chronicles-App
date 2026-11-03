<script lang="ts">
	import type { Person } from "../lib/api/types";
	import { initials } from "../lib/format";

	let { person, size = "md" }: { person: Person; size?: "sm" | "md" | "lg" } =
		$props();
	const sizes = {
		sm: "h-8 w-8 text-xs",
		md: "h-10 w-10 text-sm",
		lg: "h-16 w-16 text-xl",
	};
	const colors = {
		Female: "bg-rose-100 text-rose-800",
		Male: "bg-sky-100 text-sky-800",
		Diverse: "bg-violet-100 text-violet-800",
		Unknown: "bg-bark-100 text-bark-800",
	};
</script>

<span
	class="inline-flex shrink-0 items-center justify-center rounded-full font-semibold {sizes[
		size
	]} {colors[person.Gender]}"
	class:opacity-70={!!person.DateOfDeath}
	aria-hidden="true">{initials(person)}</span
>

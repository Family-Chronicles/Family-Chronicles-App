<script lang="ts">
	import type { Person } from "../lib/api/types";
	import { fullName, years } from "../lib/format";
	import { href } from "../lib/router";

	let { person, root = false }: { person: Person; root?: boolean } = $props();
	const border = {
		Female: "border-rose-300",
		Male: "border-sky-300",
		Diverse: "border-violet-300",
		Unknown: "border-bark-200",
	};
</script>

<a
	href={href(`/persons/${person.Id}/tree`)}
	class="block w-44 shrink-0 rounded-lg border-2 bg-white px-3 py-2 text-left shadow-sm transition hover:shadow-md {border[
		person.Gender
	]}"
	class:ring-4={root}
	class:ring-bark-200={root}
>
	<span
		class="block truncate text-sm font-semibold text-bark-900"
		title={fullName(person)}>{fullName(person)}</span
	>
	<span class="block text-xs text-stone-500">{years(person) || " "}</span>
</a>

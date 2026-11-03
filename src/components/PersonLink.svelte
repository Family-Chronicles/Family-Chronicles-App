<script lang="ts">
	import type { Person } from "../lib/api/types";
	import { fullName, years } from "../lib/format";
	import { href } from "../lib/router";
	import Avatar from "./Avatar.svelte";

	let { person, sub }: { person: Person; sub?: string } = $props();
</script>

<a
	href={href(`/persons/${person.Id}`)}
	class="group flex items-center gap-3 rounded-lg p-2 hover:bg-bark-50"
>
	<Avatar {person} />
	<span class="min-w-0">
		<span class="block truncate font-medium text-bark-900 group-hover:underline"
			>{fullName(person)}</span
		>
		<span class="block truncate text-xs text-stone-500"
			>{sub ?? years(person)}</span
		>
	</span>
</a>

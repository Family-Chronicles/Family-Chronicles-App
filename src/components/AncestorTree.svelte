<script lang="ts">
	import type { AncestorNode } from "../lib/api/types";
	import TreeCard from "./TreeCard.svelte";
	import Self from "./AncestorTree.svelte";

	/** Pedigree: person on the left, parents to the right */
	let {
		node,
		root = false,
		linkFor,
	}: {
		node: AncestorNode;
		root?: boolean;
		linkFor?: (p: { Id: string }) => string;
	} = $props();
</script>

<div class="flex items-center">
	<TreeCard person={node.Person} {root} {linkFor} />
	{#if node.Parents.length}
		<div class="h-0.5 w-6 bg-bark-200"></div>
		<div
			class="flex flex-col justify-center gap-3 border-l-2 border-bark-200 py-1 pl-0"
		>
			{#each node.Parents as parent (parent.Person.Id)}
				<div class="flex items-center">
					<div class="h-0.5 w-6 bg-bark-200"></div>
					<Self node={parent} {linkFor} />
				</div>
			{/each}
		</div>
	{/if}
</div>

<script lang="ts">
	import type { DescendantNode } from "../lib/api/types";
	import TreeCard from "./TreeCard.svelte";
	import Self from "./DescendantTree.svelte";

	/** Person and partners on top, children below */
	let { node, root = false }: { node: DescendantNode; root?: boolean } =
		$props();
</script>

<div class="flex flex-col items-center">
	<div class="flex items-center gap-2">
		<TreeCard person={node.Person} {root} />
		{#each node.Partners as partner (partner.Id)}
			<span class="text-bark-400" aria-label="verbunden mit">⚭</span>
			<TreeCard person={partner} />
		{/each}
	</div>
	{#if node.Children.length}
		<div class="h-5 w-0.5 bg-bark-200"></div>
		<div class="flex gap-4">
			{#each node.Children as child, i (child.Person.Id)}
				<div class="relative flex flex-col items-center pt-5">
					<!-- horizontal connector -->
					<div
						class="absolute top-0 h-0.5 bg-bark-200"
						style="left: {i === 0 ? '50%' : '-0.5rem'}; right: {i ===
						node.Children.length - 1
							? '50%'
							: '-0.5rem'}"
					></div>
					<div class="absolute top-0 h-5 w-0.5 bg-bark-200"></div>
					<Self node={child} />
				</div>
			{/each}
		</div>
	{/if}
</div>

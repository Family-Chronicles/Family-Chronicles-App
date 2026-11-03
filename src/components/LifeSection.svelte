<script lang="ts">
	import type { Person } from "../lib/api/types";
	import { formatDate } from "../lib/format";
	import { t } from "../lib/i18n";

	/** Life events (sorted by date, undated last) and sources of a person */
	let { person }: { person: Person } = $props();

	let events = $derived(
		[...(person.Events ?? [])].sort((a, b) =>
			(a.Date ?? "9999").localeCompare(b.Date ?? "9999"),
		),
	);
	let sources = $derived(person.Sources ?? []);
	const safeUrl = (url: string | null) =>
		url && /^https?:\/\//i.test(url) ? url : null;
</script>

{#if events.length}
	<section class="card p-5">
		<h2 class="mb-3 text-lg font-semibold">{$t("events.title")}</h2>
		<ol
			class="relative space-y-3 border-l-2 border-bark-100 pl-4"
			data-testid="life-events"
		>
			{#each events as ev, i (i)}
				<li class="relative">
					<span
						class="absolute top-1.5 -left-[1.3rem] h-2.5 w-2.5 rounded-full bg-bark-400"
					></span>
					<p class="text-sm font-medium text-bark-900">
						{$t(`events.types.${ev.Type}`)}{#if ev.Description}: {ev.Description}{/if}
					</p>
					<p class="text-xs text-stone-500">
						{[formatDate(ev.Date), ev.Place].filter(Boolean).join(" · ")}
					</p>
				</li>
			{/each}
		</ol>
	</section>
{/if}

{#if sources.length}
	<section class="card p-5">
		<h2 class="mb-3 text-lg font-semibold">{$t("sources.title")}</h2>
		<ul class="space-y-2 text-sm" data-testid="sources">
			{#each sources as src, i (i)}
				<li>
					{#if safeUrl(src.Url)}
						<a
							class="link font-medium"
							href={safeUrl(src.Url)}
							target="_blank"
							rel="noopener noreferrer">{src.Title}</a
						>
					{:else}
						<span class="font-medium text-bark-900">{src.Title}</span>
					{/if}
					{#if src.Citation}<span class="block text-xs text-stone-500"
							>{src.Citation}</span
						>{/if}
				</li>
			{/each}
		</ul>
	</section>
{/if}

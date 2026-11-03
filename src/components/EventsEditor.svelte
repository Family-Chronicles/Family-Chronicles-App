<script lang="ts">
	import { EVENT_TYPES, type PersonEvent } from "../lib/api/types";
	import { t } from "../lib/i18n";
	import DateInput from "./DateInput.svelte";

	let { events = $bindable([]) }: { events?: PersonEvent[] } = $props();

	function add() {
		events = [
			...events,
			{ Type: "Occupation", Date: null, Place: null, Description: "" },
		];
	}
	function remove(index: number) {
		events = events.filter((_, i) => i !== index);
	}
</script>

<fieldset class="space-y-3">
	<legend class="mb-2 text-lg font-semibold text-bark-900"
		>{$t("events.title")}</legend
	>
	{#each events as ev, i (i)}
		<div
			class="grid gap-3 rounded-lg border border-bark-100 bg-bark-50/50 p-3 sm:grid-cols-[10rem_1fr_1fr_auto]"
			data-testid="event-row"
		>
			<div>
				<label class="label" for="ev-type-{i}">{$t("events.type")}</label>
				<select id="ev-type-{i}" class="input" bind:value={ev.Type}>
					{#each EVENT_TYPES as type (type)}<option value={type}
							>{$t(`events.types.${type}`)}</option
						>{/each}
				</select>
			</div>
			<DateInput
				id="ev-date-{i}"
				label={$t("events.date")}
				bind:value={ev.Date}
			/>
			<div>
				<label class="label" for="ev-place-{i}">{$t("events.place")}</label>
				<input
					id="ev-place-{i}"
					class="input"
					value={ev.Place ?? ""}
					oninput={(e) => (ev.Place = e.currentTarget.value.trim() || null)}
				/>
			</div>
			<button
				type="button"
				class="btn-ghost self-end text-red-700"
				onclick={() => remove(i)}
				aria-label={$t("events.remove")}>✕</button
			>
			<div class="sm:col-span-4">
				<label class="label" for="ev-desc-{i}">{$t("events.description")}</label
				>
				<input
					id="ev-desc-{i}"
					class="input"
					placeholder={$t("events.descriptionHint")}
					bind:value={ev.Description}
				/>
			</div>
		</div>
	{/each}
	<button type="button" class="btn-secondary" onclick={add}
		>{$t("events.add")}</button
	>
</fieldset>

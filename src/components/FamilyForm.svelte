<script lang="ts">
	import { t } from "../lib/i18n";
	import type { Family, FamilyInput } from "../lib/api/types";
	import Modal from "./Modal.svelte";

	let {
		open = $bindable(false),
		family = null,
		onsave,
	}: {
		open?: boolean;
		family?: Family | null;
		onsave: (data: FamilyInput) => Promise<void>;
	} = $props();

	let name = $state("");
	let description = $state("");
	let notes = $state("");
	let historical = $state("");
	let busy = $state(false);

	$effect(() => {
		if (open) {
			name = family?.Name ?? "";
			description = family?.Description ?? "";
			notes = family?.Notes ?? "";
			historical = family?.HistoricalNames.join(", ") ?? "";
		}
	});

	async function save() {
		busy = true;
		try {
			await onsave({
				Name: name.trim(),
				Description: description,
				Notes: notes,
				HistoricalNames: historical
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean),
			});
			open = false;
		} finally {
			busy = false;
		}
	}
</script>

<Modal
	bind:open
	title={family ? $t("families.editTitle") : $t("families.newTitle")}
>
	<div class="space-y-4">
		<div>
			<label class="label" for="fam-name">{$t("families.name")}</label>
			<input id="fam-name" class="input" bind:value={name} />
		</div>
		<div>
			<label class="label" for="fam-hist"
				>{$t("families.historicalNames")}</label
			>
			<input
				id="fam-hist"
				class="input"
				placeholder={$t("families.historicalHint")}
				bind:value={historical}
			/>
		</div>
		<div>
			<label class="label" for="fam-desc">{$t("common.description")}</label>
			<textarea id="fam-desc" class="input" bind:value={description}></textarea>
		</div>
		<div>
			<label class="label" for="fam-notes">{$t("common.notes")}</label>
			<textarea id="fam-notes" class="input" bind:value={notes}></textarea>
		</div>
	</div>
	{#snippet footer()}
		<button class="btn-secondary" onclick={() => (open = false)}
			>{$t("common.cancel")}</button
		>
		<button class="btn-primary" disabled={!name.trim() || busy} onclick={save}
			>{$t("common.save")}</button
		>
	{/snippet}
</Modal>

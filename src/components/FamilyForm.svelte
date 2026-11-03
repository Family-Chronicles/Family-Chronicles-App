<script lang="ts">
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

<Modal bind:open title={family ? "Familie bearbeiten" : "Neue Familie"}>
	<div class="space-y-4">
		<div>
			<label class="label" for="fam-name">Name *</label>
			<input id="fam-name" class="input" bind:value={name} />
		</div>
		<div>
			<label class="label" for="fam-hist">Historische Namen</label>
			<input
				id="fam-hist"
				class="input"
				placeholder="kommagetrennt, z. B. Schmitt, Schmid"
				bind:value={historical}
			/>
		</div>
		<div>
			<label class="label" for="fam-desc">Beschreibung</label>
			<textarea id="fam-desc" class="input" bind:value={description}></textarea>
		</div>
		<div>
			<label class="label" for="fam-notes">Notizen</label>
			<textarea id="fam-notes" class="input" bind:value={notes}></textarea>
		</div>
	</div>
	{#snippet footer()}
		<button class="btn-secondary" onclick={() => (open = false)}
			>Abbrechen</button
		>
		<button class="btn-primary" disabled={!name.trim() || busy} onclick={save}
			>Speichern</button
		>
	{/snippet}
</Modal>

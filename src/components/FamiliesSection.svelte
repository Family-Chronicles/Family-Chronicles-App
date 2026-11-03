<script lang="ts">
	import { api } from "../lib/api/client";
	import type {
		DateString,
		Family,
		Membership,
		Person,
	} from "../lib/api/types";
	import { formatDate } from "../lib/format";
	import { href } from "../lib/router";
	import { canEdit } from "../lib/state/session";
	import { notify, notifyError } from "../lib/state/toasts";
	import Modal from "./Modal.svelte";
	import DateInput from "./DateInput.svelte";
	import ConfirmButton from "./ConfirmButton.svelte";

	let {
		person,
		memberships,
		onchange,
	}: { person: Person; memberships: Membership[]; onchange: () => void } =
		$props();

	let open = $state(false);
	let families = $state<Family[]>([]);
	let familyId = $state("");
	let role = $state("");
	let startDate = $state<DateString>(null);
	let endDate = $state<DateString>(null);
	let busy = $state(false);

	async function openNew() {
		familyId = "";
		role = "";
		startDate = endDate = null;
		open = true;
		try {
			const joined = new Set(memberships.map((m) => m.FamilyId));
			families = (await api.families.list()).filter((f) => !joined.has(f.Id));
		} catch (e) {
			notifyError(e);
		}
	}

	async function save() {
		busy = true;
		try {
			await api.memberships.create({
				FamilyId: familyId,
				PersonId: person.Id,
				Role: role || "Mitglied",
				StartDate: startDate,
				EndDate: endDate,
				Notes: "",
			});
			notify("Zur Familie hinzugefügt.");
			open = false;
			onchange();
		} catch (e) {
			notifyError(e);
		} finally {
			busy = false;
		}
	}

	async function remove(m: Membership) {
		await api.memberships.remove(m.Id);
		notify("Aus der Familie entfernt.");
		onchange();
	}
</script>

<section class="card p-5">
	<div class="mb-3 flex items-center justify-between">
		<h2 class="text-lg font-semibold">Familien</h2>
		{#if $canEdit}<button class="btn-secondary" onclick={openNew}
				>+ Familie</button
			>{/if}
	</div>
	{#if memberships.length === 0}
		<p class="text-sm text-stone-500">Gehört noch keiner Familie an.</p>
	{:else}
		<ul class="space-y-2">
			{#each memberships as m (m.Id)}
				<li
					class="flex items-center justify-between gap-2 rounded-lg bg-bark-50 px-3 py-2"
				>
					<div>
						<a
							class="font-medium text-bark-900 hover:underline"
							href={href(`/families/${m.FamilyId}`)}
							>{m.Family?.Name ?? "Familie"}</a
						>
						<p class="text-xs text-stone-500">
							{m.Role}{#if m.StartDate || m.EndDate}&nbsp;· {formatDate(
									m.StartDate,
								) || "?"} – {formatDate(m.EndDate) || "heute"}{/if}
						</p>
					</div>
					{#if $canEdit}
						<ConfirmButton
							class="btn-ghost text-xs text-red-700"
							message="{person.FirstNames[0]} wird aus dieser Familie entfernt."
							confirmLabel="Entfernen"
							onconfirm={() => remove(m)}>Entfernen</ConfirmButton
						>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<Modal bind:open title="Zu Familie hinzufügen" size="sm">
	<div class="space-y-4">
		<div>
			<label class="label" for="mem-family">Familie</label>
			<select id="mem-family" class="input" bind:value={familyId}>
				<option value="" disabled>Bitte wählen …</option>
				{#each families as f (f.Id)}<option value={f.Id}>{f.Name}</option
					>{/each}
			</select>
			{#if families.length === 0}<p class="mt-1 text-xs text-stone-500">
					Keine weiteren Familien vorhanden. <a
						class="link"
						href={href("/families")}>Familie anlegen</a
					>
				</p>{/if}
		</div>
		<div>
			<label class="label" for="mem-role">Rolle</label>
			<input
				id="mem-role"
				class="input"
				placeholder="z. B. Mutter, Sohn, Stiefkind"
				bind:value={role}
			/>
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<DateInput id="mem-start" label="Seit" bind:value={startDate} />
			<DateInput id="mem-end" label="Bis" bind:value={endDate} />
		</div>
	</div>
	{#snippet footer()}
		<button class="btn-secondary" onclick={() => (open = false)}
			>Abbrechen</button
		>
		<button class="btn-primary" disabled={!familyId || busy} onclick={save}
			>Hinzufügen</button
		>
	{/snippet}
</Modal>

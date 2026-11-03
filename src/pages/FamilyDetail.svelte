<script lang="ts">
	import { onMount } from "svelte";
	import { api } from "../lib/api/client";
	import type {
		DateString,
		Family,
		FamilyInput,
		Membership,
	} from "../lib/api/types";
	import { formatDate } from "../lib/format";
	import { go, href } from "../lib/router";
	import { canEdit } from "../lib/state/session";
	import { notify, notifyError } from "../lib/state/toasts";
	import Loading from "../components/Loading.svelte";
	import PageHeader from "../components/PageHeader.svelte";
	import FamilyForm from "../components/FamilyForm.svelte";
	import ConfirmButton from "../components/ConfirmButton.svelte";
	import PersonLink from "../components/PersonLink.svelte";
	import PersonPicker from "../components/PersonPicker.svelte";
	import Modal from "../components/Modal.svelte";
	import DateInput from "../components/DateInput.svelte";

	let { params }: { params: Record<string, string> } = $props();
	const id = $derived(params.id);

	let family = $state<Family | null>(null);
	let members = $state<Membership[]>([]);
	let loading = $state(true);
	let formOpen = $state(false);

	let addOpen = $state(false);
	let personId = $state<string | null>(null);
	let role = $state("");
	let startDate = $state<DateString>(null);
	let endDate = $state<DateString>(null);

	async function load() {
		try {
			[family, members] = await Promise.all([
				api.families.get(id),
				api.families.members(id),
			]);
		} catch (e) {
			notifyError(e);
		} finally {
			loading = false;
		}
	}
	onMount(load);

	async function update(data: FamilyInput) {
		try {
			await api.families.update(id, data);
			notify("Familie gespeichert.");
			await load();
		} catch (e) {
			notifyError(e);
			throw e;
		}
	}

	async function remove() {
		await api.families.remove(id);
		notify("Familie gelöscht.");
		go("/families");
	}

	function openAdd() {
		personId = null;
		role = "";
		startDate = endDate = null;
		addOpen = true;
	}

	async function addMember() {
		if (!personId) return;
		try {
			await api.memberships.create({
				FamilyId: id,
				PersonId: personId,
				Role: role || "Mitglied",
				StartDate: startDate,
				EndDate: endDate,
				Notes: "",
			});
			addOpen = false;
			notify("Mitglied hinzugefügt.");
			await load();
		} catch (e) {
			notifyError(e);
		}
	}

	async function removeMember(m: Membership) {
		await api.memberships.remove(m.Id);
		notify("Mitglied entfernt.");
		await load();
	}
</script>

{#if loading}
	<Loading />
{:else if !family}
	<p class="text-stone-600">
		Diese Familie existiert nicht. <a class="link" href={href("/families")}
			>Zur Übersicht</a
		>
	</p>
{:else}
	<PageHeader
		title="Familie {family.Name}"
		subtitle={family.HistoricalNames.length
			? `auch: ${family.HistoricalNames.join(", ")}`
			: undefined}
	>
		{#snippet actions()}
			{#if $canEdit}
				<button class="btn-secondary" onclick={() => (formOpen = true)}
					>Bearbeiten</button
				>
				<ConfirmButton
					message="Die Familie {family?.Name} wird gelöscht. Die Personen bleiben erhalten."
					onconfirm={remove}>Löschen</ConfirmButton
				>
			{/if}
		{/snippet}
	</PageHeader>

	<div class="grid gap-6 lg:grid-cols-3">
		<section class="card space-y-4 p-5">
			{#if family.Description}<p class="text-sm whitespace-pre-wrap">
					{family.Description}
				</p>{/if}
			<div>
				<h2 class="mb-2 text-xs tracking-wide text-stone-500 uppercase">
					Nachnamen der Mitglieder
				</h2>
				<div class="flex flex-wrap gap-1">
					{#each family.Surnames ?? [] as n (n)}<span class="chip">{n}</span
						>{:else}<span class="text-sm text-stone-500">–</span>{/each}
				</div>
			</div>
			{#if family.Notes}
				<div>
					<h2 class="mb-1 text-xs tracking-wide text-stone-500 uppercase">
						Notizen
					</h2>
					<p class="text-sm whitespace-pre-wrap">{family.Notes}</p>
				</div>
			{/if}
		</section>

		<section class="card p-5 lg:col-span-2">
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Mitglieder ({members.length})</h2>
				{#if $canEdit}<button class="btn-secondary" onclick={openAdd}
						>+ Mitglied</button
					>{/if}
			</div>
			{#if members.length === 0}
				<p class="text-sm text-stone-500">Noch keine Mitglieder.</p>
			{:else}
				<ul class="grid gap-1 sm:grid-cols-2">
					{#each members as m (m.Id)}
						{#if m.Person}
							<li class="flex items-center gap-1">
								<div class="min-w-0 flex-1">
									<PersonLink
										person={m.Person}
										sub="{m.Role}{m.StartDate || m.EndDate
											? ` · ${formatDate(m.StartDate) || '?'} – ${formatDate(m.EndDate) || 'heute'}`
											: ''}"
									/>
								</div>
								{#if $canEdit}
									<ConfirmButton
										class="btn-ghost text-xs text-red-700"
										message="Die Person wird aus der Familie entfernt."
										confirmLabel="Entfernen"
										onconfirm={() => removeMember(m)}
										>✕<span class="sr-only">Entfernen</span></ConfirmButton
									>
								{/if}
							</li>
						{/if}
					{/each}
				</ul>
			{/if}
		</section>
	</div>

	<FamilyForm bind:open={formOpen} {family} onsave={update} />

	<Modal bind:open={addOpen} title="Mitglied hinzufügen" size="sm">
		<div class="space-y-4">
			<PersonPicker
				id="member-person"
				bind:value={personId}
				exclude={members.map((m) => m.PersonId)}
			/>
			<div>
				<label class="label" for="member-role">Rolle</label>
				<input
					id="member-role"
					class="input"
					placeholder="z. B. Mutter, Sohn, Stiefkind"
					bind:value={role}
				/>
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				<DateInput id="member-start" label="Seit" bind:value={startDate} />
				<DateInput id="member-end" label="Bis" bind:value={endDate} />
			</div>
		</div>
		{#snippet footer()}
			<button class="btn-secondary" onclick={() => (addOpen = false)}
				>Abbrechen</button
			>
			<button class="btn-primary" disabled={!personId} onclick={addMember}
				>Hinzufügen</button
			>
		{/snippet}
	</Modal>
{/if}

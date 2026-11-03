<script lang="ts">
	import { t } from "../lib/i18n";
	import { api } from "../lib/api/client";
	import type { DateString, Person, Relationship } from "../lib/api/types";
	import { formatDate } from "../lib/format";
	import {
		KIND_ORDER,
		toInput,
		viewFrom,
		type RelationKind,
	} from "../lib/relations";
	import { canEdit } from "../lib/state/session";
	import { notify, notifyError } from "../lib/state/toasts";
	import Modal from "./Modal.svelte";
	import PersonPicker from "./PersonPicker.svelte";
	import PersonLink from "./PersonLink.svelte";
	import DateInput from "./DateInput.svelte";
	import ConfirmButton from "./ConfirmButton.svelte";

	let {
		person,
		relationships,
		persons,
		onchange,
	}: {
		person: Person;
		relationships: Relationship[];
		persons: Map<string, Person>;
		onchange: () => void;
	} = $props();

	let relations = $derived(
		relationships
			.map((r) => viewFrom(person.Id, r))
			.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)),
	);

	let open = $state(false);
	let editing = $state<Relationship | null>(null);
	let otherId = $state<string | null>(null);
	let kind = $state<RelationKind>("Parent");
	let role = $state("");
	let startDate = $state<DateString>(null);
	let endDate = $state<DateString>(null);
	let notes = $state("");
	let busy = $state(false);

	function openNew() {
		editing = null;
		otherId = null;
		kind = "Parent";
		role = "";
		startDate = endDate = null;
		notes = "";
		open = true;
	}

	function openEdit(r: Relationship) {
		const view = viewFrom(person.Id, r);
		editing = r;
		otherId = view.otherId;
		kind = view.kind;
		role = r.Role;
		startDate = r.StartDate;
		endDate = r.EndDate;
		notes = r.Notes;
		open = true;
	}

	async function save() {
		if (!otherId) return;
		busy = true;
		try {
			const data = toInput(person.Id, otherId, kind, {
				Role: role,
				StartDate: startDate,
				EndDate: endDate,
				Notes: notes,
			});
			if (editing) await api.relationships.update(editing.Id, data);
			else await api.relationships.create(data);
			notify($t("relations.saved"));
			open = false;
			onchange();
		} catch (e) {
			notifyError(e);
		} finally {
			busy = false;
		}
	}

	async function remove(r: Relationship) {
		await api.relationships.remove(r.Id);
		notify($t("relations.removed"));
		onchange();
	}

	const period = (r: Relationship) =>
		r.StartDate || r.EndDate
			? `${formatDate(r.StartDate) || "?"} – ${formatDate(r.EndDate) || $t("common.today")}`
			: "";
</script>

<section class="card p-5">
	<div class="mb-3 flex items-center justify-between">
		<h2 class="text-lg font-semibold">{$t("relations.title")}</h2>
		{#if $canEdit}<button class="btn-secondary" onclick={openNew}
				>{$t("relations.add")}</button
			>{/if}
	</div>
	{#if relations.length === 0}
		<p class="text-sm text-stone-500">{$t("relations.empty")}</p>
	{:else}
		<ul class="divide-y divide-bark-50">
			{#each relations as rel (rel.relationship.Id)}
				{@const other = persons.get(rel.otherId)}
				<li class="flex items-center gap-3 py-1">
					<span
						class="w-28 shrink-0 text-xs font-medium tracking-wide text-stone-500 uppercase"
					>
						{rel.relationship.Role || $t(`relations.kind.${rel.kind}`)}
					</span>
					<div class="min-w-0 flex-1">
						{#if other}<PersonLink
								person={other}
								sub={period(rel.relationship) || undefined}
							/>{/if}
					</div>
					{#if $canEdit}
						<button
							class="btn-ghost text-xs"
							onclick={() => openEdit(rel.relationship)}
							>{$t("common.edit")}</button
						>
						<ConfirmButton
							class="btn-ghost text-xs text-red-700"
							message={$t("relations.removeMessage")}
							confirmLabel={$t("common.remove")}
							onconfirm={() => remove(rel.relationship)}
							>{$t("common.remove")}</ConfirmButton
						>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<Modal
	bind:open
	title={editing ? $t("relations.editTitle") : $t("relations.addTitle")}
>
	<div class="space-y-4">
		<PersonPicker
			id="rel-person"
			bind:value={otherId}
			exclude={[person.Id]}
			label={$t("common.person")}
		/>
		<div>
			<label class="label" for="rel-kind"
				>{$t("relations.isFor", { name: person.FirstNames[0] })}</label
			>
			<select id="rel-kind" class="input" bind:value={kind}>
				{#each KIND_ORDER as k (k)}<option value={k}
						>{$t(`relations.kind.${k}`)}</option
					>{/each}
			</select>
		</div>
		<div>
			<label class="label" for="rel-role">{$t("common.roleOptional")}</label>
			<input
				id="rel-role"
				class="input"
				placeholder={$t("relations.roleHint")}
				bind:value={role}
			/>
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<DateInput
				id="rel-start"
				label={$t("common.start")}
				bind:value={startDate}
			/>
			<DateInput id="rel-end" label={$t("common.end")} bind:value={endDate} />
		</div>
		<div>
			<label class="label" for="rel-notes">{$t("common.notes")}</label>
			<textarea id="rel-notes" class="input" bind:value={notes}></textarea>
		</div>
	</div>
	{#snippet footer()}
		<button class="btn-secondary" onclick={() => (open = false)}
			>{$t("common.cancel")}</button
		>
		<button class="btn-primary" disabled={!otherId || busy} onclick={save}
			>{$t("common.save")}</button
		>
	{/snippet}
</Modal>

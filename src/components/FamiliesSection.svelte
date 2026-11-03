<script lang="ts">
	import { t } from "../lib/i18n";
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
				Role: role || $t("common.member"),
				StartDate: startDate,
				EndDate: endDate,
				Notes: "",
			});
			notify($t("memberships.added"));
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
		notify($t("memberships.removed"));
		onchange();
	}
</script>

<section class="card p-5">
	<div class="mb-3 flex items-center justify-between">
		<h2 class="text-lg font-semibold">{$t("memberships.title")}</h2>
		{#if $canEdit}<button class="btn-secondary" onclick={openNew}
				>{$t("memberships.add")}</button
			>{/if}
	</div>
	{#if memberships.length === 0}
		<p class="text-sm text-stone-500">{$t("memberships.empty")}</p>
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
							>{m.Family?.Name ?? $t("memberships.family")}</a
						>
						<p class="text-xs text-stone-500">
							{m.Role}{#if m.StartDate || m.EndDate}&nbsp;· {formatDate(
									m.StartDate,
								) || "?"} – {formatDate(m.EndDate) || $t("common.today")}{/if}
						</p>
					</div>
					{#if $canEdit}
						<ConfirmButton
							class="btn-ghost text-xs text-red-700"
							message={$t("memberships.removeMessage", {
								name: person.FirstNames[0],
							})}
							confirmLabel={$t("common.remove")}
							onconfirm={() => remove(m)}>{$t("common.remove")}</ConfirmButton
						>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<Modal bind:open title={$t("memberships.addTitle")} size="sm">
	<div class="space-y-4">
		<div>
			<label class="label" for="mem-family">{$t("memberships.family")}</label>
			<select id="mem-family" class="input" bind:value={familyId}>
				<option value="" disabled>{$t("memberships.choose")}</option>
				{#each families as f (f.Id)}<option value={f.Id}>{f.Name}</option
					>{/each}
			</select>
			{#if families.length === 0}<p class="mt-1 text-xs text-stone-500">
					{$t("memberships.noMore")}
					<a class="link" href={href("/families")}
						>{$t("memberships.createFamily")}</a
					>
				</p>{/if}
		</div>
		<div>
			<label class="label" for="mem-role">{$t("common.role")}</label>
			<input
				id="mem-role"
				class="input"
				placeholder={$t("common.roleHint")}
				bind:value={role}
			/>
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<DateInput
				id="mem-start"
				label={$t("common.since")}
				bind:value={startDate}
			/>
			<DateInput id="mem-end" label={$t("common.until")} bind:value={endDate} />
		</div>
	</div>
	{#snippet footer()}
		<button class="btn-secondary" onclick={() => (open = false)}
			>{$t("common.cancel")}</button
		>
		<button class="btn-primary" disabled={!familyId || busy} onclick={save}
			>{$t("common.add")}</button
		>
	{/snippet}
</Modal>

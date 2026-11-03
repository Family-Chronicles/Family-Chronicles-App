<script lang="ts">
	import { t } from "../lib/i18n";
	import { onMount } from "svelte";
	import { autoReload } from "../lib/state/live";
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
	onMount(() => {
		load();
		return autoReload(["families", "memberships", "persons"], load);
	});

	async function update(data: FamilyInput) {
		try {
			await api.families.update(id, data);
			notify($t("families.saved"));
			await load();
		} catch (e) {
			notifyError(e);
			throw e;
		}
	}

	async function remove() {
		await api.families.remove(id);
		notify($t("families.deleted"));
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
				Role: role || $t("common.member"),
				StartDate: startDate,
				EndDate: endDate,
				Notes: "",
			});
			addOpen = false;
			notify($t("families.memberAdded"));
			await load();
		} catch (e) {
			notifyError(e);
		}
	}

	async function removeMember(m: Membership) {
		await api.memberships.remove(m.Id);
		notify($t("families.memberRemoved"));
		await load();
	}
</script>

{#if loading}
	<Loading />
{:else if !family}
	<p class="text-stone-600">
		{$t("families.missing")}
		<a class="link" href={href("/families")}>{$t("common.toOverview")}</a>
	</p>
{:else}
	<PageHeader
		title={$t("families.heading", { name: family.Name })}
		subtitle={family.HistoricalNames.length
			? $t("families.also", { names: family.HistoricalNames.join(", ") })
			: undefined}
	>
		{#snippet actions()}
			{#if $canEdit}
				<button class="btn-secondary" onclick={() => (formOpen = true)}
					>{$t("common.edit")}</button
				>
				<ConfirmButton
					message={$t("families.deleteMessage", { name: family?.Name ?? "" })}
					onconfirm={remove}>{$t("common.delete")}</ConfirmButton
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
					{$t("families.surnames")}
				</h2>
				<div class="flex flex-wrap gap-1">
					{#each family.Surnames ?? [] as n (n)}<span class="chip">{n}</span
						>{:else}<span class="text-sm text-stone-500">–</span>{/each}
				</div>
			</div>
			{#if family.Notes}
				<div>
					<h2 class="mb-1 text-xs tracking-wide text-stone-500 uppercase">
						{$t("common.notes")}
					</h2>
					<p class="text-sm whitespace-pre-wrap">{family.Notes}</p>
				</div>
			{/if}
		</section>

		<section class="card p-5 lg:col-span-2">
			<div class="mb-3 flex items-center justify-between">
				<h2 class="text-lg font-semibold">
					{$t("families.membersTitle", { count: members.length })}
				</h2>
				{#if $canEdit}<button class="btn-secondary" onclick={openAdd}
						>{$t("families.addMember")}</button
					>{/if}
			</div>
			{#if members.length === 0}
				<p class="text-sm text-stone-500">{$t("families.noMembers")}</p>
			{:else}
				<ul class="grid gap-1 sm:grid-cols-2">
					{#each members as m (m.Id)}
						{#if m.Person}
							<li class="flex items-center gap-1">
								<div class="min-w-0 flex-1">
									<PersonLink
										person={m.Person}
										sub="{m.Role}{m.StartDate || m.EndDate
											? ` · ${formatDate(m.StartDate) || '?'} – ${formatDate(m.EndDate) || $t('common.today')}`
											: ''}"
									/>
								</div>
								{#if $canEdit}
									<ConfirmButton
										class="btn-ghost text-xs text-red-700"
										message={$t("families.removeMemberMessage")}
										confirmLabel={$t("common.remove")}
										onconfirm={() => removeMember(m)}
										>✕<span class="sr-only">{$t("common.remove")}</span
										></ConfirmButton
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

	<Modal bind:open={addOpen} title={$t("families.addMemberTitle")} size="sm">
		<div class="space-y-4">
			<PersonPicker
				id="member-person"
				bind:value={personId}
				exclude={members.map((m) => m.PersonId)}
			/>
			<div>
				<label class="label" for="member-role">{$t("common.role")}</label>
				<input
					id="member-role"
					class="input"
					placeholder={$t("common.roleHint")}
					bind:value={role}
				/>
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				<DateInput
					id="member-start"
					label={$t("common.since")}
					bind:value={startDate}
				/>
				<DateInput
					id="member-end"
					label={$t("common.until")}
					bind:value={endDate}
				/>
			</div>
		</div>
		{#snippet footer()}
			<button class="btn-secondary" onclick={() => (addOpen = false)}
				>{$t("common.cancel")}</button
			>
			<button class="btn-primary" disabled={!personId} onclick={addMember}
				>{$t("common.add")}</button
			>
		{/snippet}
	</Modal>
{/if}

<script lang="ts">
	import { t } from "../lib/i18n";
	import { onMount } from "svelte";
	import { autoReload } from "../lib/state/live";
	import { api } from "../lib/api/client";
	import { ROLES, type Role, type User } from "../lib/api/types";
	import { currentUser, updateUser } from "../lib/state/session";
	import { notify, notifyError } from "../lib/state/toasts";
	import PageHeader from "../components/PageHeader.svelte";
	import Loading from "../components/Loading.svelte";
	import Modal from "../components/Modal.svelte";
	import ConfirmButton from "../components/ConfirmButton.svelte";

	let users = $state<User[]>([]);
	let loading = $state(true);
	let open = $state(false);
	let editing = $state<User | null>(null);
	let name = $state("");
	let email = $state("");
	let password = $state("");
	let role = $state<Role>("Viewer");
	let busy = $state(false);

	async function load() {
		try {
			users = (await api.users.list()).sort((a, b) =>
				a.Name.localeCompare(b.Name),
			);
		} catch (e) {
			notifyError(e);
		} finally {
			loading = false;
		}
	}
	onMount(() => {
		load();
		return autoReload(["users"], load);
	});

	function openForm(u: User | null) {
		editing = u;
		name = u?.Name ?? "";
		email = u?.Email ?? "";
		password = "";
		role = u?.Role ?? "Viewer";
		open = true;
	}

	async function save() {
		busy = true;
		try {
			if (editing) {
				const updated = await api.users.update(editing.Id, {
					Name: name,
					Email: email,
					Role: role,
					...(password ? { Password: password } : {}),
				});
				if (updated.Id === $currentUser?.Id) updateUser(updated);
			} else {
				await api.users.create({
					Name: name,
					Email: email,
					Password: password,
					Role: role,
				});
			}
			notify($t("users.saved"));
			open = false;
			await load();
		} catch (e) {
			notifyError(e);
		} finally {
			busy = false;
		}
	}

	async function remove(u: User) {
		try {
			await api.users.remove(u.Id);
			notify($t("users.deleted"));
			await load();
		} catch (e) {
			notifyError(e);
		}
	}
</script>

<PageHeader title={$t("users.title")} subtitle={$t("users.subtitle")}>
	{#snippet actions()}<button class="btn-primary" onclick={() => openForm(null)}
			>{$t("users.create")}</button
		>{/snippet}
</PageHeader>

{#if loading}
	<Loading />
{:else}
	<div class="card overflow-x-auto">
		<table class="w-full text-left text-sm">
			<thead
				class="border-b border-bark-100 text-xs tracking-wide text-stone-500 uppercase"
			>
				<tr
					><th class="px-4 py-3">{$t("users.name")}</th><th class="px-4 py-3"
						>{$t("users.email")}</th
					><th class="px-4 py-3">{$t("users.role")}</th><th class="px-4 py-3"
						><span class="sr-only">{$t("users.actions")}</span></th
					></tr
				>
			</thead>
			<tbody class="divide-y divide-bark-50">
				{#each users as u (u.Id)}
					<tr>
						<td class="px-4 py-3 font-medium text-bark-900"
							>{u.Name}{#if u.Id === $currentUser?.Id}<span class="ml-2 chip"
									>{$t("common.you")}</span
								>{/if}</td
						>
						<td class="px-4 py-3">{u.Email}</td>
						<td class="px-4 py-3"><span class="chip">{u.Role}</span></td>
						<td class="px-4 py-3 text-right whitespace-nowrap">
							<button class="btn-ghost text-xs" onclick={() => openForm(u)}
								>{$t("common.edit")}</button
							>
							{#if u.Id !== $currentUser?.Id}
								<ConfirmButton
									class="btn-ghost text-xs text-red-700"
									message={$t("users.deleteMessage", { name: u.Name })}
									onconfirm={() => remove(u)}
									>{$t("common.delete")}</ConfirmButton
								>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<Modal
	bind:open
	title={editing ? $t("users.editTitle") : $t("users.newTitle")}
	size="sm"
>
	<div class="space-y-4">
		<div>
			<label class="label" for="u-name">{$t("users.name")}</label><input
				id="u-name"
				class="input"
				bind:value={name}
			/>
		</div>
		<div>
			<label class="label" for="u-email">{$t("users.email")}</label><input
				id="u-email"
				class="input"
				type="email"
				bind:value={email}
			/>
		</div>
		<div>
			<label class="label" for="u-pass"
				>{editing ? $t("users.newPassword") : $t("users.password")}</label
			>
			<input
				id="u-pass"
				class="input"
				type="password"
				autocomplete="new-password"
				minlength="8"
				bind:value={password}
			/>
			<p class="mt-1 text-xs text-stone-500">{$t("users.passwordHint")}</p>
		</div>
		<fieldset>
			<legend class="label">{$t("users.role")}</legend>
			<div class="space-y-2">
				{#each ROLES as r (r)}
					<label class="flex items-start gap-2 text-sm">
						<input
							type="radio"
							name="role"
							value={r}
							bind:group={role}
							class="mt-1 accent-bark-700"
						/>
						<span>{$t(`users.roles.${r}`)}</span>
					</label>
				{/each}
			</div>
		</fieldset>
	</div>
	{#snippet footer()}
		<button class="btn-secondary" onclick={() => (open = false)}
			>{$t("common.cancel")}</button
		>
		<button
			class="btn-primary"
			disabled={busy || !name || !email || (!editing && password.length < 8)}
			onclick={save}>{$t("common.save")}</button
		>
	{/snippet}
</Modal>

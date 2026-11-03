<script lang="ts">
	import { onMount } from "svelte";
	import { api } from "../lib/api/client";
	import { ROLES, type Role, type User } from "../lib/api/types";
	import { currentUser, updateUser } from "../lib/state/session";
	import { notify, notifyError } from "../lib/state/toasts";
	import PageHeader from "../components/PageHeader.svelte";
	import Loading from "../components/Loading.svelte";
	import Modal from "../components/Modal.svelte";
	import ConfirmButton from "../components/ConfirmButton.svelte";

	const ROLE_INFO: Record<Role, string> = {
		Viewer: "Leser – darf Personen und Familien ansehen",
		Editor: "Editor – darf zusätzlich Personen, Familien und Medien bearbeiten",
		Admin: "Admin – voller Zugriff inkl. Benutzerverwaltung",
	};

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
	onMount(load);

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
			notify("Benutzer gespeichert.");
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
			notify("Benutzer gelöscht.");
			await load();
		} catch (e) {
			notifyError(e);
		}
	}
</script>

<PageHeader
	title="Benutzer"
	subtitle="Wer darf die Chronik lesen und bearbeiten?"
>
	{#snippet actions()}<button class="btn-primary" onclick={() => openForm(null)}
			>+ Benutzer anlegen</button
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
					><th class="px-4 py-3">Name</th><th class="px-4 py-3">E-Mail</th><th
						class="px-4 py-3">Rolle</th
					><th class="px-4 py-3"><span class="sr-only">Aktionen</span></th></tr
				>
			</thead>
			<tbody class="divide-y divide-bark-50">
				{#each users as u (u.Id)}
					<tr>
						<td class="px-4 py-3 font-medium text-bark-900"
							>{u.Name}{#if u.Id === $currentUser?.Id}<span class="ml-2 chip"
									>du</span
								>{/if}</td
						>
						<td class="px-4 py-3">{u.Email}</td>
						<td class="px-4 py-3"><span class="chip">{u.Role}</span></td>
						<td class="px-4 py-3 text-right whitespace-nowrap">
							<button class="btn-ghost text-xs" onclick={() => openForm(u)}
								>Bearbeiten</button
							>
							{#if u.Id !== $currentUser?.Id}
								<ConfirmButton
									class="btn-ghost text-xs text-red-700"
									message="{u.Name} verliert den Zugang zur Chronik."
									onconfirm={() => remove(u)}>Löschen</ConfirmButton
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
	title={editing ? "Benutzer bearbeiten" : "Neuer Benutzer"}
	size="sm"
>
	<div class="space-y-4">
		<div>
			<label class="label" for="u-name">Name</label><input
				id="u-name"
				class="input"
				bind:value={name}
			/>
		</div>
		<div>
			<label class="label" for="u-email">E-Mail</label><input
				id="u-email"
				class="input"
				type="email"
				bind:value={email}
			/>
		</div>
		<div>
			<label class="label" for="u-pass"
				>{editing ? "Neues Passwort (optional)" : "Passwort"}</label
			>
			<input
				id="u-pass"
				class="input"
				type="password"
				autocomplete="new-password"
				minlength="8"
				bind:value={password}
			/>
			<p class="mt-1 text-xs text-stone-500">Mindestens 8 Zeichen.</p>
		</div>
		<fieldset>
			<legend class="label">Rolle</legend>
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
						<span>{ROLE_INFO[r]}</span>
					</label>
				{/each}
			</div>
		</fieldset>
	</div>
	{#snippet footer()}
		<button class="btn-secondary" onclick={() => (open = false)}
			>Abbrechen</button
		>
		<button
			class="btn-primary"
			disabled={busy || !name || !email || (!editing && password.length < 8)}
			onclick={save}>Speichern</button
		>
	{/snippet}
</Modal>

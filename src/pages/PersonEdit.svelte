<script lang="ts">
	import { onMount } from "svelte";
	import { api, ApiError } from "../lib/api/client";
	import { GENDERS, type Gender, type PersonInput } from "../lib/api/types";
	import { GENDER_LABEL, splitNames } from "../lib/format";
	import { go, href } from "../lib/router";
	import { notify, notifyError } from "../lib/state/toasts";
	import PageHeader from "../components/PageHeader.svelte";
	import DateInput from "../components/DateInput.svelte";
	import Loading from "../components/Loading.svelte";

	let { params }: { params: Record<string, string> } = $props();
	const id = $derived(params.id);

	let loading = $state(true);
	let busy = $state(false);
	let errors = $state<Record<string, string[]>>({});

	let firstNames = $state("");
	let middleNames = $state("");
	let lastNames = $state("");
	let birthName = $state("");
	let gender = $state<Gender>("Unknown");
	let dateOfBirth = $state<string | null>(null);
	let placeOfBirth = $state("");
	let dateOfDeath = $state<string | null>(null);
	let placeOfDeath = $state("");
	let causeOfDeath = $state("");
	let notes = $state("");

	onMount(async () => {
		if (!id) {
			loading = false;
			return;
		}
		try {
			const p = await api.persons.get(id);
			firstNames = p.FirstNames.join(" ");
			middleNames = p.MiddleNames.join(" ");
			lastNames = p.LastNames.join(" ");
			birthName = p.BirthName ?? "";
			gender = p.Gender;
			dateOfBirth = p.DateOfBirth;
			placeOfBirth = p.PlaceOfBirth ?? "";
			dateOfDeath = p.DateOfDeath;
			placeOfDeath = p.PlaceOfDeath ?? "";
			causeOfDeath = p.CauseOfDeath ?? "";
			notes = p.Notes;
		} catch (e) {
			notifyError(e);
		} finally {
			loading = false;
		}
	});

	const orNull = (s: string) => s.trim() || null;

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		errors = {};
		const data: PersonInput = {
			FirstNames: splitNames(firstNames),
			MiddleNames: splitNames(middleNames),
			LastNames: splitNames(lastNames),
			BirthName: orNull(birthName),
			Gender: gender,
			DateOfBirth: dateOfBirth,
			PlaceOfBirth: orNull(placeOfBirth),
			DateOfDeath: dateOfDeath,
			PlaceOfDeath: orNull(placeOfDeath),
			CauseOfDeath: orNull(causeOfDeath),
			Notes: notes,
		};
		try {
			const saved = id
				? await api.persons.update(id, data)
				: await api.persons.create(data);
			notify(id ? "Änderungen gespeichert." : "Person angelegt.");
			go(`/persons/${saved.Id}`);
		} catch (err) {
			if (err instanceof ApiError) errors = err.fieldErrors;
			notifyError(err);
		} finally {
			busy = false;
		}
	}
</script>

<PageHeader title={id ? "Person bearbeiten" : "Neue Person"} />

{#if loading}
	<Loading />
{:else}
	<form class="card space-y-8 p-6" onsubmit={submit}>
		<fieldset class="grid gap-4 sm:grid-cols-2">
			<legend class="mb-2 text-lg font-semibold text-bark-900">Name</legend>
			<div>
				<label class="label" for="first">Vorname(n) *</label>
				<input id="first" class="input" required bind:value={firstNames} />
				{#if errors.FirstNames}<p class="mt-1 text-xs text-red-700">
						Bitte einen Vornamen angeben.
					</p>{/if}
			</div>
			<div>
				<label class="label" for="middle">Mittelname(n)</label>
				<input id="middle" class="input" bind:value={middleNames} />
			</div>
			<div>
				<label class="label" for="last">Nachname(n) *</label>
				<input id="last" class="input" required bind:value={lastNames} />
			</div>
			<div>
				<label class="label" for="birthname">Geburtsname</label>
				<input id="birthname" class="input" bind:value={birthName} />
			</div>
			<div>
				<label class="label" for="gender">Geschlecht</label>
				<select id="gender" class="input" bind:value={gender}>
					{#each GENDERS as g (g)}<option value={g}>{GENDER_LABEL[g]}</option
						>{/each}
				</select>
			</div>
		</fieldset>

		<fieldset class="grid gap-4 sm:grid-cols-2">
			<legend class="mb-2 text-lg font-semibold text-bark-900">Geburt</legend>
			<DateInput id="dob" label="Geburtsdatum" bind:value={dateOfBirth} />
			<div>
				<label class="label" for="pob">Geburtsort</label>
				<input id="pob" class="input" bind:value={placeOfBirth} />
			</div>
		</fieldset>

		<fieldset class="grid gap-4 sm:grid-cols-2">
			<legend class="mb-2 text-lg font-semibold text-bark-900">Tod</legend>
			<DateInput id="dod" label="Sterbedatum" bind:value={dateOfDeath} />
			<div>
				<label class="label" for="pod">Sterbeort</label>
				<input id="pod" class="input" bind:value={placeOfDeath} />
			</div>
			<div class="sm:col-span-2">
				<label class="label" for="cod">Todesursache</label>
				<input id="cod" class="input" bind:value={causeOfDeath} />
			</div>
		</fieldset>

		<div>
			<label class="label" for="notes">Notizen</label>
			<textarea id="notes" class="input min-h-32" bind:value={notes}></textarea>
		</div>

		<div class="flex justify-end gap-2">
			<a class="btn-secondary" href={href(id ? `/persons/${id}` : "/persons")}
				>Abbrechen</a
			>
			<button class="btn-primary" disabled={busy}
				>{busy ? "Speichern …" : "Speichern"}</button
			>
		</div>
	</form>
{/if}

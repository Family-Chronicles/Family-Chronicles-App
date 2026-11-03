<script lang="ts">
	import { api } from "../lib/api/client";
	import type { Media, MediaTag, Person } from "../lib/api/types";
	import { formatSize, fullName, MEDIA_LABEL } from "../lib/format";
	import { href } from "../lib/router";
	import { canEdit } from "../lib/state/session";
	import { notify, notifyError } from "../lib/state/toasts";
	import Modal from "./Modal.svelte";
	import MediaFile from "./MediaFile.svelte";
	import PersonPicker from "./PersonPicker.svelte";
	import ConfirmButton from "./ConfirmButton.svelte";

	let {
		person,
		own,
		tagged,
		persons,
		onchange,
	}: {
		person: Person;
		own: Media[];
		tagged: Media[];
		persons: Map<string, Person>;
		onchange: () => void;
	} = $props();

	// --- upload ---
	let uploadOpen = $state(false);
	let mode = $state<"file" | "text">("file");
	let title = $state("");
	let description = $state("");
	let content = $state("");
	let files = $state<FileList | undefined>();
	let busy = $state(false);

	function openUpload() {
		mode = "file";
		title = description = content = "";
		files = undefined;
		uploadOpen = true;
	}

	async function upload() {
		busy = true;
		try {
			if (mode === "file") {
				const file = files?.[0];
				if (!file) return;
				const form = new FormData();
				form.set("PersonId", person.Id);
				form.set("Title", title || file.name);
				form.set("Description", description);
				form.set("file", file);
				await api.media.upload(form);
			} else {
				await api.media.createText({
					PersonId: person.Id,
					Title: title,
					Description: description,
					Content: content,
				});
			}
			notify("Medium gespeichert.");
			uploadOpen = false;
			onchange();
		} catch (e) {
			notifyError(e);
		} finally {
			busy = false;
		}
	}

	// --- viewer with tags ---
	let viewOpen = $state(false);
	let current = $state<Media | null>(null);
	let tags = $state<MediaTag[]>([]);
	let tagPerson = $state<string | null>(null);
	let placing = $state(false);

	async function show(m: Media) {
		current = m;
		viewOpen = true;
		tagPerson = null;
		placing = false;
		await reloadTags();
	}

	async function reloadTags() {
		if (!current) return;
		tags = (await api.media.get(current.Id)).Tags ?? [];
	}

	async function addTag(x: number | null = null, y: number | null = null) {
		if (!current || !tagPerson) return;
		try {
			await api.media.addTag(current.Id, { PersonId: tagPerson, X: x, Y: y });
			tagPerson = null;
			placing = false;
			await reloadTags();
			onchange();
		} catch (e) {
			notifyError(e);
		}
	}

	function placeTag(e: MouseEvent) {
		if (!placing) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		addTag(
			Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1),
			Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1),
		);
	}

	async function removeTag(t: MediaTag) {
		if (!current) return;
		await api.media.removeTag(current.Id, t.Id);
		await reloadTags();
		onchange();
	}

	async function removeMedia() {
		if (!current) return;
		await api.media.remove(current.Id);
		notify("Medium gelöscht.");
		viewOpen = false;
		onchange();
	}
</script>

<section class="card p-5">
	<div class="mb-3 flex items-center justify-between">
		<h2 class="text-lg font-semibold">Bilder, Videos &amp; Dokumente</h2>
		{#if $canEdit}<button class="btn-secondary" onclick={openUpload}
				>+ Hinzufügen</button
			>{/if}
	</div>
	{#if own.length === 0 && tagged.length === 0}
		<p class="text-sm text-stone-500">Noch keine Medien vorhanden.</p>
	{/if}
	{#each [{ list: own, label: "" }, { list: tagged, label: `Medien, auf denen ${person.FirstNames[0]} markiert ist` }] as group (group.label)}
		{#if group.list.length}
			{#if group.label}<h3 class="mt-4 mb-2 text-sm font-medium text-stone-600">
					{group.label}
				</h3>{/if}
			<ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
				{#each group.list as m (m.Id)}
					<li>
						<button
							class="group block w-full text-left"
							onclick={() => show(m)}
						>
							<div
								class="aspect-square overflow-hidden rounded-lg border border-bark-100 transition group-hover:border-bark-300"
							>
								<MediaFile media={m} thumb />
							</div>
							<p class="mt-1 truncate text-sm font-medium text-bark-900">
								{m.Title}
							</p>
							<p class="text-xs text-stone-500">
								{MEDIA_LABEL[m.Type]}
								{formatSize(m.Size)}
							</p>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	{/each}
</section>

<Modal bind:open={uploadOpen} title="Medium hinzufügen">
	<div class="space-y-4">
		<div
			class="inline-flex rounded-lg border border-bark-200 p-0.5 text-sm"
			role="group"
		>
			<button
				class="rounded-md px-3 py-1.5 {mode === 'file'
					? 'bg-bark-100 font-medium'
					: ''}"
				aria-pressed={mode === "file"}
				onclick={() => (mode = "file")}>Datei</button
			>
			<button
				class="rounded-md px-3 py-1.5 {mode === 'text'
					? 'bg-bark-100 font-medium'
					: ''}"
				aria-pressed={mode === "text"}
				onclick={() => (mode = "text")}>Text</button
			>
		</div>
		{#if mode === "file"}
			<div>
				<label class="label" for="media-file"
					>Datei (Bild, Video, Audio, PDF …)</label
				>
				<input id="media-file" type="file" class="input" bind:files />
			</div>
		{/if}
		<div>
			<label class="label" for="media-title"
				>Titel{mode === "text" ? " *" : ""}</label
			>
			<input
				id="media-title"
				class="input"
				bind:value={title}
				placeholder={mode === "file" ? "Standard: Dateiname" : ""}
			/>
		</div>
		<div>
			<label class="label" for="media-desc">Beschreibung</label>
			<textarea id="media-desc" class="input" bind:value={description}
			></textarea>
		</div>
		{#if mode === "text"}
			<div>
				<label class="label" for="media-content">Text *</label>
				<textarea
					id="media-content"
					class="input min-h-40 font-serif"
					bind:value={content}></textarea>
			</div>
		{/if}
	</div>
	{#snippet footer()}
		<button class="btn-secondary" onclick={() => (uploadOpen = false)}
			>Abbrechen</button
		>
		<button
			class="btn-primary"
			disabled={busy || (mode === "file" ? !files?.length : !title || !content)}
			onclick={upload}
		>
			{busy ? "Speichern …" : "Speichern"}
		</button>
	{/snippet}
</Modal>

<Modal bind:open={viewOpen} title={current?.Title ?? ""} size="xl">
	{#if current}
		<div class="grid gap-6 lg:grid-cols-[1fr_16rem]">
			<div>
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<div
					class="relative"
					class:cursor-crosshair={placing}
					onclick={placeTag}
				>
					<MediaFile media={current} />
					{#each tags.filter((t) => t.X !== null && t.Y !== null) as t (t.Id)}
						<span
							class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-bark-800/85 px-2 py-0.5 text-xs whitespace-nowrap text-white shadow"
							style="left: {t.X! * 100}%; top: {t.Y! * 100}%"
							>{fullName(persons.get(t.PersonId))}</span
						>
					{/each}
				</div>
				{#if current.Description}<p class="mt-3 text-sm text-stone-700">
						{current.Description}
					</p>{/if}
				<p class="mt-2 text-xs text-stone-500">
					Gehört zu <a class="link" href={href(`/persons/${current.PersonId}`)}
						>{fullName(persons.get(current.PersonId))}</a
					>
					{#if current.FileName}· {current.FileName}
						{formatSize(current.Size)}{/if}
				</p>
			</div>
			<aside class="space-y-4">
				<div>
					<h3 class="mb-2 text-sm font-semibold">Markierte Personen</h3>
					{#if tags.length === 0}<p class="text-sm text-stone-500">
							Niemand markiert.
						</p>{/if}
					<ul class="space-y-1">
						{#each tags as t (t.Id)}
							<li class="flex items-center justify-between gap-2 text-sm">
								<a class="link truncate" href={href(`/persons/${t.PersonId}`)}
									>{fullName(persons.get(t.PersonId))}</a
								>
								{#if $canEdit}<button
										class="text-xs text-red-700 hover:underline"
										onclick={() => removeTag(t)}>entfernen</button
									>{/if}
							</li>
						{/each}
					</ul>
				</div>
				{#if $canEdit}
					<div class="space-y-2 rounded-lg bg-bark-50 p-3">
						<PersonPicker
							id="tag-person"
							label="Person markieren"
							bind:value={tagPerson}
							exclude={tags.map((t) => t.PersonId)}
						/>
						{#if current.Type === "Image"}
							<button
								class="btn-secondary w-full"
								disabled={!tagPerson}
								onclick={() => (placing = true)}
							>
								{placing ? "Jetzt ins Bild klicken …" : "Im Bild platzieren"}
							</button>
						{/if}
						<button
							class="btn-primary w-full"
							disabled={!tagPerson}
							onclick={() => addTag()}>Ohne Position markieren</button
						>
					</div>
					<ConfirmButton
						class="btn-ghost w-full text-red-700"
						message="Das Medium und alle Markierungen werden gelöscht."
						onconfirm={removeMedia}>Medium löschen</ConfirmButton
					>
				{/if}
			</aside>
		</div>
	{/if}
</Modal>

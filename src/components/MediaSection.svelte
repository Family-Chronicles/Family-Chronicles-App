<script lang="ts">
	import { api } from "../lib/api/client";
	import type { Media, MediaTag, Person } from "../lib/api/types";
	import { formatSize, fullName } from "../lib/format";
	import { t } from "../lib/i18n";
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
			notify($t("media.saved"));
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

	async function removeTag(tag: MediaTag) {
		if (!current) return;
		await api.media.removeTag(current.Id, tag.Id);
		await reloadTags();
		onchange();
	}

	async function removeMedia() {
		if (!current) return;
		await api.media.remove(current.Id);
		notify($t("media.deleted"));
		viewOpen = false;
		onchange();
	}
</script>

<section class="card p-5">
	<div class="mb-3 flex items-center justify-between">
		<h2 class="text-lg font-semibold">{$t("media.title")}</h2>
		{#if $canEdit}<button class="btn-secondary" onclick={openUpload}
				>{$t("media.add")}</button
			>{/if}
	</div>
	{#if own.length === 0 && tagged.length === 0}
		<p class="text-sm text-stone-500">{$t("media.empty")}</p>
	{/if}
	{#each [{ list: own, label: "" }, { list: tagged, label: $t( "media.taggedOn", { name: person.FirstNames[0] } ) }] as group (group.label)}
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
								{$t(`media.type.${m.Type}`)}
								{formatSize(m.Size)}
							</p>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	{/each}
</section>

<Modal bind:open={uploadOpen} title={$t("media.addTitle")}>
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
				onclick={() => (mode = "file")}>{$t("media.file")}</button
			>
			<button
				class="rounded-md px-3 py-1.5 {mode === 'text'
					? 'bg-bark-100 font-medium'
					: ''}"
				aria-pressed={mode === "text"}
				onclick={() => (mode = "text")}>{$t("media.text")}</button
			>
		</div>
		{#if mode === "file"}
			<div>
				<label class="label" for="media-file">{$t("media.fileLabel")}</label>
				<input id="media-file" type="file" class="input" bind:files />
			</div>
		{/if}
		<div>
			<label class="label" for="media-title"
				>{$t("media.titleLabel")}{mode === "text" ? " *" : ""}</label
			>
			<input
				id="media-title"
				class="input"
				bind:value={title}
				placeholder={mode === "file" ? $t("media.titlePlaceholder") : ""}
			/>
		</div>
		<div>
			<label class="label" for="media-desc">{$t("common.description")}</label>
			<textarea id="media-desc" class="input" bind:value={description}
			></textarea>
		</div>
		{#if mode === "text"}
			<div>
				<label class="label" for="media-content">{$t("media.textLabel")}</label>
				<textarea
					id="media-content"
					class="input min-h-40 font-serif"
					bind:value={content}></textarea>
			</div>
		{/if}
	</div>
	{#snippet footer()}
		<button class="btn-secondary" onclick={() => (uploadOpen = false)}
			>{$t("common.cancel")}</button
		>
		<button
			class="btn-primary"
			disabled={busy || (mode === "file" ? !files?.length : !title || !content)}
			onclick={upload}
		>
			{busy ? $t("common.saving") : $t("common.save")}
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
					{#each tags.filter((x) => x.X !== null && x.Y !== null) as tag (tag.Id)}
						<span
							class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-bark-800/85 px-2 py-0.5 text-xs whitespace-nowrap text-white shadow"
							style="left: {tag.X! * 100}%; top: {tag.Y! * 100}%"
							>{fullName(persons.get(tag.PersonId))}</span
						>
					{/each}
				</div>
				{#if current.Description}<p class="mt-3 text-sm text-stone-700">
						{current.Description}
					</p>{/if}
				<p class="mt-2 text-xs text-stone-500">
					{$t("media.belongsTo")}
					<a class="link" href={href(`/persons/${current.PersonId}`)}
						>{fullName(persons.get(current.PersonId))}</a
					>
					{#if current.FileName}· {current.FileName}
						{formatSize(current.Size)}{/if}
				</p>
			</div>
			<aside class="space-y-4">
				<div>
					<h3 class="mb-2 text-sm font-semibold">{$t("media.tagged")}</h3>
					{#if tags.length === 0}<p class="text-sm text-stone-500">
							{$t("media.noTags")}
						</p>{/if}
					<ul class="space-y-1">
						{#each tags as tag (tag.Id)}
							<li class="flex items-center justify-between gap-2 text-sm">
								<a class="link truncate" href={href(`/persons/${tag.PersonId}`)}
									>{fullName(persons.get(tag.PersonId))}</a
								>
								{#if $canEdit}<button
										class="text-xs text-red-700 hover:underline"
										onclick={() => removeTag(tag)}
										>{$t("media.removeTag")}</button
									>{/if}
							</li>
						{/each}
					</ul>
				</div>
				{#if $canEdit}
					<div class="space-y-2 rounded-lg bg-bark-50 p-3">
						<PersonPicker
							id="tag-person"
							label={$t("media.tagPerson")}
							bind:value={tagPerson}
							exclude={tags.map((x) => x.PersonId)}
						/>
						{#if current.Type === "Image"}
							<button
								class="btn-secondary w-full"
								disabled={!tagPerson}
								onclick={() => (placing = true)}
							>
								{placing ? $t("media.clickImage") : $t("media.placeInImage")}
							</button>
						{/if}
						<button
							class="btn-primary w-full"
							disabled={!tagPerson}
							onclick={() => addTag()}>{$t("media.tagWithoutPosition")}</button
						>
					</div>
					<ConfirmButton
						class="btn-ghost w-full text-red-700"
						message={$t("media.deleteMessage")}
						onconfirm={removeMedia}>{$t("media.deleteMedia")}</ConfirmButton
					>
				{/if}
			</aside>
		</div>
	{/if}
</Modal>

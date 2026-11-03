<script lang="ts">
	import { t } from "../lib/i18n";
	import { api } from "../lib/api/client";
	import type { Media } from "../lib/api/types";

	/** Loads a protected media file with the auth token and shows it */
	let { media, thumb = false }: { media: Media; thumb?: boolean } = $props();

	let url = $state<string | null>(null);
	let failed = $state(false);

	$effect(() => {
		const current = media;
		if (
			!current.FileName ||
			!["Image", "Video", "Audio", "Document"].includes(current.Type)
		)
			return;
		let objectUrl: string | null = null;
		let cancelled = false;
		api.media
			.file(current.Id)
			.then((blob) => {
				if (cancelled) return;
				objectUrl = URL.createObjectURL(blob);
				url = objectUrl;
			})
			.catch(() => (failed = true));
		return () => {
			cancelled = true;
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	});
</script>

{#if media.Type === "Image" && url}
	<img
		src={url}
		alt={media.Title}
		class={thumb
			? "h-full w-full object-cover"
			: "max-h-[60vh] w-full object-contain"}
		draggable="false"
	/>
{:else if media.Type === "Video" && url && !thumb}
	<!-- svelte-ignore a11y_media_has_caption -->
	<video src={url} controls class="max-h-[60vh] w-full"></video>
{:else if media.Type === "Audio" && url && !thumb}
	<audio src={url} controls class="w-full"></audio>
{:else if media.Type === "Document" && url && !thumb && media.MimeType === "application/pdf"}
	<iframe
		src={url}
		title={media.Title}
		class="h-[60vh] w-full rounded-lg border border-bark-100"
	></iframe>
{:else if media.Type === "Text" && !thumb}
	<div
		class="prose max-w-none rounded-lg bg-bark-50 p-4 font-serif whitespace-pre-wrap text-ink"
	>
		{media.Content}
	</div>
{:else}
	<div
		class="flex h-full w-full flex-col items-center justify-center gap-1 bg-bark-50 p-3 text-center text-bark-700"
	>
		<span class="text-2xl" aria-hidden="true">
			{media.Type === "Text"
				? "✎"
				: media.Type === "Video"
					? "▶"
					: media.Type === "Audio"
						? "♪"
						: "▤"}
		</span>
		<span class="text-xs"
			>{failed ? $t("media.notLoadable") : $t(`media.type.${media.Type}`)}</span
		>
		{#if !thumb && url}<a
				class="link text-sm"
				href={url}
				download={media.FileName}>{$t("media.download")}</a
			>{/if}
	</div>
{/if}

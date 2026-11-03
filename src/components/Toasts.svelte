<script lang="ts">
	import { dismiss, toasts } from "../lib/state/toasts";
	import { t } from "../lib/i18n";

	const style = {
		success: "border-moss-500 bg-white",
		error: "border-red-600 bg-red-50",
		info: "border-bark-400 bg-white",
	};
</script>

<div
	class="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
>
	{#each $toasts as toast (toast.id)}
		<div
			class="pointer-events-auto flex items-start gap-3 rounded-lg border-l-4 p-3 text-sm shadow-lg {style[
				toast.kind
			]}"
		>
			<p class="flex-1">{toast.message}</p>
			<button
				class="text-stone-400 hover:text-stone-700"
				onclick={() => dismiss(toast.id)}
				aria-label={$t("common.close")}>✕</button
			>
		</div>
	{/each}
</div>

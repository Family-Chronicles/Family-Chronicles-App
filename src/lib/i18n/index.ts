import { createI18n } from "@bquery/bquery/i18n";
import { computed, effect, persistedSignal } from "@bquery/bquery/reactive";
import { fromSignal } from "../state/svelte";
import { de } from "./de";
import { en } from "./en";

export const LOCALES = [
	{ code: "de", label: "Deutsch" },
	{ code: "en", label: "English" },
] as const;
export type Locale = (typeof LOCALES)[number]["code"];

const initial: Locale =
	typeof navigator !== "undefined" &&
	navigator.language?.toLowerCase().startsWith("de")
		? "de"
		: "en";

/** Chosen language, remembered in localStorage */
export const localeSignal = persistedSignal<Locale>("fc.locale", initial);

export const i18n = createI18n({
	locale: localeSignal.peek(),
	fallbackLocale: "de",
	messages: { de, en },
});

// keep bQuery's locale and the <html lang> in sync with the stored choice
effect(() => {
	const locale = localeSignal.value;
	i18n.$locale.value = locale;
	if (typeof document !== "undefined") document.documentElement.lang = locale;
});

export type TranslateParams = Record<string, string | number>;
type Translate = (key: string, params?: TranslateParams) => string;

/** Svelte store with the translate function; changes when the language changes */
export const t = fromSignal<Translate>(
	computed(() => {
		const locale = i18n.$locale.value;
		return (key: string, params?: TranslateParams) => {
			void locale;
			return i18n.t(key, params);
		};
	}),
);

export const locale = fromSignal(localeSignal);

/** Translate outside of components (e.g. in the API client) */
export const translate: Translate = (key, params) => i18n.t(key, params);

export function setLocale(code: Locale): void {
	localeSignal.value = code;
}

import { describe, expect, it } from "vitest";
import { de } from "./de";
import { en } from "./en";

/** Flattens nested messages into "a.b.c" keys */
const keys = (obj: object, prefix = ""): string[] =>
	Object.entries(obj).flatMap(([k, v]) =>
		typeof v === "string"
			? [`${prefix}${k}`]
			: keys(v as object, `${prefix}${k}.`),
	);

const params = (s: string) =>
	[...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("translations", () => {
	it("English has every German key", () => {
		expect(keys(en).sort()).toEqual(keys(de).sort());
	});

	it("uses the same parameters in both languages", () => {
		const get = (o: object, path: string) =>
			path.split(".").reduce((a: any, k) => a[k], o) as string;
		for (const key of keys(de)) {
			expect(params(get(en, key)), key).toEqual(params(get(de, key)));
		}
	});
});

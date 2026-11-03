import { describe, expect, it } from "vitest";
import { toInput, viewFrom } from "./relations";
import type { Relationship } from "./api/types";

const base = { Role: "", StartDate: null, EndDate: null, Notes: "" };

describe("relations", () => {
	it("shows parent links from both sides", () => {
		const r: Relationship = {
			Id: "1",
			PersonId: "mum",
			RelatedPersonId: "kid",
			Type: "Parent",
			...base,
		};
		expect(viewFrom("kid", r)).toMatchObject({
			otherId: "mum",
			kind: "Parent",
		});
		expect(viewFrom("mum", r)).toMatchObject({ otherId: "kid", kind: "Child" });
	});

	it("builds payloads from the perspective of a person", () => {
		expect(toInput("kid", "mum", "Parent", base)).toMatchObject({
			PersonId: "mum",
			RelatedPersonId: "kid",
			Type: "Parent",
		});
		expect(toInput("mum", "kid", "Child", base)).toMatchObject({
			PersonId: "mum",
			RelatedPersonId: "kid",
			Type: "Parent",
		});
		expect(toInput("a", "b", "Spouse", base)).toMatchObject({
			PersonId: "a",
			RelatedPersonId: "b",
			Type: "Spouse",
		});
	});
});

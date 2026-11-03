import type {
	Relationship,
	RelationshipInput,
	RelationshipType,
} from "./api/types";

/** How a relationship looks from the perspective of one person */
export type RelationKind =
	| "Parent"
	| "Child"
	| "Spouse"
	| "Partner"
	| "Sibling"
	| "Related"
	| "Other"
	| "Unknown";

export const KIND_ORDER: RelationKind[] = [
	"Parent",
	"Spouse",
	"Partner",
	"Sibling",
	"Child",
	"Related",
	"Other",
	"Unknown",
];

export interface Relation {
	relationship: Relationship;
	otherId: string;
	kind: RelationKind;
}

/** e.g. "Parent" stored as A→B is "Child" seen from A and "Parent" seen from B */
export function viewFrom(personId: string, r: Relationship): Relation {
	const otherId = r.PersonId === personId ? r.RelatedPersonId : r.PersonId;
	let kind: RelationKind = r.Type;
	if (r.Type === "Parent") kind = r.PersonId === personId ? "Child" : "Parent";
	return { relationship: r, otherId, kind };
}

/** Builds the API payload for "<other> is <kind> of <person>" */
export function toInput(
	personId: string,
	otherId: string,
	kind: RelationKind,
	extra: Pick<RelationshipInput, "Role" | "StartDate" | "EndDate" | "Notes">,
): RelationshipInput {
	if (kind === "Parent")
		return {
			PersonId: otherId,
			RelatedPersonId: personId,
			Type: "Parent",
			...extra,
		};
	if (kind === "Child")
		return {
			PersonId: personId,
			RelatedPersonId: otherId,
			Type: "Parent",
			...extra,
		};
	return {
		PersonId: personId,
		RelatedPersonId: otherId,
		Type: kind as RelationshipType,
		...extra,
	};
}

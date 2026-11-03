/** Types mirroring the Family Chronicles REST API (server: src/models) */

export type Role = "Admin" | "Editor" | "Viewer";
export const ROLES: Role[] = ["Viewer", "Editor", "Admin"];

export type Gender = "Male" | "Female" | "Diverse" | "Unknown";
export const GENDERS: Gender[] = ["Female", "Male", "Diverse", "Unknown"];

export type RelationshipType =
	| "Parent"
	| "Child"
	| "Spouse"
	| "Partner"
	| "Sibling"
	| "Related"
	| "Other"
	| "Unknown";

export type MediaType =
	"Image" | "Video" | "Audio" | "Text" | "Document" | "Other";

/** YYYY, YYYY-MM or YYYY-MM-DD, or null when unknown */
export type DateString = string | null;

export interface User {
	Id: string;
	Name: string;
	Email: string;
	Role: Role;
	CreatedAt: string;
	UpdatedAt: string;
}

export interface Person {
	Id: string;
	FirstNames: string[];
	MiddleNames: string[];
	LastNames: string[];
	BirthName: string | null;
	Gender: Gender;
	DateOfBirth: DateString;
	PlaceOfBirth: string | null;
	DateOfDeath: DateString;
	PlaceOfDeath: string | null;
	CauseOfDeath: string | null;
	Notes: string;
	CreatedAt: string;
	UpdatedAt: string;
}

export type PersonInput = Omit<Person, "Id" | "CreatedAt" | "UpdatedAt">;

export interface Family {
	Id: string;
	Name: string;
	Description: string;
	Notes: string;
	HistoricalNames: string[];
	MemberCount?: number;
	Surnames?: string[];
}

export type FamilyInput = Pick<
	Family,
	"Name" | "Description" | "Notes" | "HistoricalNames"
>;

export interface Membership {
	Id: string;
	FamilyId: string;
	PersonId: string;
	Role: string;
	StartDate: DateString;
	EndDate: DateString;
	Notes: string;
	Person?: Person | null;
	Family?: Family | null;
}

export interface Relationship {
	Id: string;
	PersonId: string;
	RelatedPersonId: string;
	Type: RelationshipType;
	Role: string;
	StartDate: DateString;
	EndDate: DateString;
	Notes: string;
}

export type RelationshipInput = Omit<Relationship, "Id">;

export interface Media {
	Id: string;
	PersonId: string;
	Title: string;
	Description: string;
	Type: MediaType;
	Content: string | null;
	FileName: string | null;
	MimeType: string | null;
	Size: number | null;
	CreatedAt: string;
	Tags?: MediaTag[];
}

export interface MediaTag {
	Id: string;
	MediaId: string;
	PersonId: string;
	X: number | null;
	Y: number | null;
	Notes: string;
}

export interface AncestorNode {
	Person: Person;
	Parents: AncestorNode[];
}

export interface DescendantNode {
	Person: Person;
	Partners: Person[];
	Children: DescendantNode[];
}

export interface FamilyTree {
	Root: Person;
	Ancestors: AncestorNode;
	Descendants: DescendantNode;
	Siblings: Person[];
}

export interface ApiErrorBody {
	status: number;
	message: string;
	details?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
}

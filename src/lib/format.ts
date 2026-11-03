import type {
	DateString,
	Gender,
	Person,
	RelationshipType,
	MediaType,
} from "./api/types";

export function fullName(
	p:
		Pick<Person, "FirstNames" | "MiddleNames" | "LastNames"> | null | undefined,
): string {
	if (!p) return "Unbekannt";
	return (
		[...p.FirstNames, ...p.MiddleNames, ...p.LastNames].join(" ") ||
		"Ohne Namen"
	);
}

export function shortName(p: Person | null | undefined): string {
	if (!p) return "Unbekannt";
	return [p.FirstNames[0], ...p.LastNames].filter(Boolean).join(" ");
}

export function initials(p: Person): string {
	return (
		(
			(p.FirstNames[0]?.[0] ?? "") + (p.LastNames[0]?.[0] ?? "")
		).toUpperCase() || "?"
	);
}

/** Formats partial dates: 1901 → "1901", 1901-04 → "04.1901", 1901-04-12 → "12.04.1901" */
export function formatDate(d: DateString): string {
	if (!d) return "";
	const [y, m, day] = d.split("-");
	return [day, m, y].filter(Boolean).join(".");
}

export function lifespan(p: Person): string {
	const birth = p.DateOfBirth ? `* ${formatDate(p.DateOfBirth)}` : "";
	const death = p.DateOfDeath ? `† ${formatDate(p.DateOfDeath)}` : "";
	return [birth, death].filter(Boolean).join("  ");
}

export function years(p: Person): string {
	const b = p.DateOfBirth?.slice(0, 4) ?? "?";
	const d = p.DateOfDeath?.slice(0, 4) ?? "";
	return p.DateOfBirth || p.DateOfDeath ? `${b}–${d}` : "";
}

export const GENDER_LABEL: Record<Gender, string> = {
	Female: "weiblich",
	Male: "männlich",
	Diverse: "divers",
	Unknown: "unbekannt",
};

export const RELATIONSHIP_LABEL: Record<RelationshipType, string> = {
	Parent: "Elternteil von",
	Child: "Kind von",
	Spouse: "Ehepartner",
	Partner: "Partner",
	Sibling: "Geschwister",
	Related: "Verwandt",
	Other: "Sonstige",
	Unknown: "Unbekannt",
};

export const MEDIA_LABEL: Record<MediaType, string> = {
	Image: "Bild",
	Video: "Video",
	Audio: "Audio",
	Text: "Text",
	Document: "Dokument",
	Other: "Datei",
};

export function formatSize(bytes: number | null): string {
	if (!bytes) return "";
	const units = ["B", "KB", "MB", "GB"];
	let i = 0;
	let n = bytes;
	while (n >= 1024 && i < units.length - 1) {
		n /= 1024;
		i++;
	}
	return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
}

/** Splits a free text "Anna Maria" into ["Anna", "Maria"] */
export const splitNames = (s: string) =>
	s
		.split(/\s+/)
		.map((x) => x.trim())
		.filter(Boolean);

/** Accepts "", "1901", "1901-04", "1901-04-12" and German "12.04.1901" / "04.1901" */
export function parseDateInput(s: string): DateString | undefined {
	const v = s.trim();
	if (!v) return null;
	if (/^\d{4}(-\d{2}(-\d{2})?)?$/.test(v)) return v;
	const de = v.match(/^(?:(\d{1,2})\.)?(\d{1,2})\.(\d{4})$/);
	if (de) {
		const [, d, m, y] = de;
		return [y, m.padStart(2, "0"), d?.padStart(2, "0")]
			.filter(Boolean)
			.join("-");
	}
	if (/^\d{4}$/.test(v)) return v;
	return undefined;
}

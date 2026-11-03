import {
	createHttp,
	HttpError,
	type HttpRequestConfig,
} from "@bquery/bquery/reactive";
import { clearSession, getToken } from "../state/session";
import type {
	ApiErrorBody,
	Family,
	FamilyInput,
	FamilyTree,
	Media,
	MediaTag,
	Membership,
	Person,
	PersonInput,
	Relationship,
	RelationshipInput,
	Role,
	User,
} from "./types";

export const API_URL = (import.meta.env.VITE_API_URL ?? "/api/v1").replace(
	/\/$/,
	"",
);

/** Error with a readable message and optional per-field messages */
export class ApiError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly fieldErrors: Record<string, string[]> = {},
	) {
		super(message);
	}
}

const MESSAGES: Record<number, string> = {
	400: "Die Eingaben sind ungültig.",
	401: "Bitte melde dich erneut an.",
	403: "Dafür fehlen dir die Rechte.",
	404: "Nicht gefunden.",
	409: "Konflikt mit vorhandenen Daten.",
	413: "Die Datei ist zu groß.",
	429: "Zu viele Anfragen – bitte kurz warten.",
};

const http = createHttp({ timeout: 60_000 });

http.interceptors.request.use((config) => {
	const token = getToken();
	if (token) {
		const headers = new Headers(config.headers);
		headers.set("Authorization", `Bearer ${token}`);
		config.headers = headers;
	}
	return config;
});

function toApiError(error: unknown): ApiError {
	if (error instanceof HttpError && error.response) {
		const status = error.response.status;
		const body = error.response.data as Partial<ApiErrorBody> | undefined;
		if (status === 401 && getToken()) clearSession();
		const fieldErrors = body?.details?.fieldErrors ?? {};
		const server = typeof body?.message === "string" ? body.message : "";
		const message =
			status === 400 && Object.keys(fieldErrors).length
				? `${MESSAGES[400]} (${Object.keys(fieldErrors).join(", ")})`
				: server && status !== 401
					? `${MESSAGES[status] ?? "Fehler"} ${server}`.trim()
					: (MESSAGES[status] ?? `Fehler ${status}`);
		return new ApiError(message, status, fieldErrors);
	}
	return new ApiError("Der Server ist nicht erreichbar.", 0);
}

async function request<T>(config: HttpRequestConfig): Promise<T> {
	try {
		return (await http.request<T>({ ...config, url: API_URL + config.url }))
			.data;
	} catch (error) {
		throw toApiError(error);
	}
}

const get = <T>(url: string, query?: Record<string, unknown>) =>
	request<T>({ url, method: "GET", query });
const post = <T>(url: string, body: unknown) =>
	request<T>({ url, method: "POST", body: body as HttpRequestConfig["body"] });
const put = <T>(url: string, body: unknown) =>
	request<T>({ url, method: "PUT", body: body as HttpRequestConfig["body"] });
const del = (url: string) =>
	request<{ success: boolean }>({ url, method: "DELETE" });

export const api = {
	login: (Email: string, Password: string) =>
		post<{ token: string; user: User }>("/auth/login", { Email, Password }),
	me: () => get<User>("/auth/me"),
	changePassword: (CurrentPassword: string, NewPassword: string) =>
		put<{ success: boolean }>("/auth/me/password", {
			CurrentPassword,
			NewPassword,
		}),

	users: {
		list: () => get<User[]>("/users"),
		create: (data: {
			Name: string;
			Email: string;
			Password: string;
			Role: Role;
		}) => post<User>("/users", data),
		update: (
			id: string,
			data: Partial<{
				Name: string;
				Email: string;
				Password: string;
				Role: Role;
			}>,
		) => put<User>(`/users/${id}`, data),
		remove: (id: string) => del(`/users/${id}`),
	},

	persons: {
		list: (q?: string) => get<Person[]>("/persons", q ? { q } : undefined),
		get: (id: string) => get<Person>(`/persons/${id}`),
		create: (data: PersonInput) => post<Person>("/persons", data),
		update: (id: string, data: Partial<PersonInput>) =>
			put<Person>(`/persons/${id}`, data),
		remove: (id: string) => del(`/persons/${id}`),
		relationships: (id: string) =>
			get<Relationship[]>(`/persons/${id}/relationships`),
		families: (id: string) => get<Membership[]>(`/persons/${id}/families`),
		media: (id: string) =>
			get<{ Own: Media[]; Tagged: Media[] }>(`/persons/${id}/media`),
		tree: (id: string, depth = 3) =>
			get<FamilyTree>(`/persons/${id}/tree`, { depth }),
	},

	families: {
		list: () => get<Family[]>("/families"),
		get: (id: string) => get<Family>(`/families/${id}`),
		create: (data: FamilyInput) => post<Family>("/families", data),
		update: (id: string, data: Partial<FamilyInput>) =>
			put<Family>(`/families/${id}`, data),
		remove: (id: string) => del(`/families/${id}`),
		members: (id: string) => get<Membership[]>(`/families/${id}/members`),
	},

	memberships: {
		create: (data: Omit<Membership, "Id" | "Person" | "Family">) =>
			post<Membership>("/memberships", data),
		update: (
			id: string,
			data: Partial<
				Pick<Membership, "Role" | "StartDate" | "EndDate" | "Notes">
			>,
		) => put<Membership>(`/memberships/${id}`, data),
		remove: (id: string) => del(`/memberships/${id}`),
	},

	relationships: {
		create: (data: RelationshipInput) =>
			post<Relationship>("/relationships", data),
		update: (id: string, data: Partial<RelationshipInput>) =>
			put<Relationship>(`/relationships/${id}`, data),
		remove: (id: string) => del(`/relationships/${id}`),
	},

	media: {
		get: (id: string) => get<Media>(`/media/${id}`),
		upload: (form: FormData) => post<Media>("/media", form),
		createText: (data: {
			PersonId: string;
			Title: string;
			Description: string;
			Content: string;
		}) => post<Media>("/media", data),
		update: (
			id: string,
			data: Partial<
				Pick<Media, "Title" | "Description" | "Content" | "PersonId">
			>,
		) => put<Media>(`/media/${id}`, data),
		remove: (id: string) => del(`/media/${id}`),
		file: (id: string) =>
			request<Blob>({
				url: `/media/${id}/file`,
				method: "GET",
				parseAs: "blob",
			}),
		addTag: (
			id: string,
			data: { PersonId: string; X?: number | null; Y?: number | null },
		) => post<MediaTag>(`/media/${id}/tags`, data),
		removeTag: (id: string, tagId: string) => del(`/media/${id}/tags/${tagId}`),
	},
};

import {
	createHttp,
	HttpError,
	type HttpRequestConfig,
} from "@bquery/bquery/reactive";
import {
	clearSession,
	getRefreshToken,
	getToken,
	setSession,
} from "../state/session";
import { translate } from "../i18n";
import { markOwnWrite } from "../state/ownWrites";

const KNOWN = [400, 401, 403, 404, 409, 413, 429];
const errorText = (status: number) =>
	KNOWN.includes(status)
		? translate(`errors.${status}`)
		: translate("errors.generic", { status });
import type {
	ApiToken,
	LinkRelation,
	Peer,
	PersonLinkEntry,
	PeerRequest,
	RemotePerson,
	RemoteTree,
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
		const fieldErrors = body?.details?.fieldErrors ?? {};
		const server = typeof body?.message === "string" ? body.message : "";
		const message =
			status === 400 && Object.keys(fieldErrors).length
				? `${errorText(400)} (${Object.keys(fieldErrors).join(", ")})`
				: server && status !== 401
					? `${errorText(status)} ${server}`.trim()
					: errorText(status);
		return new ApiError(message, status, fieldErrors);
	}
	return new ApiError(translate("errors.offline"), 0);
}

async function request<T>(config: HttpRequestConfig): Promise<T> {
	return (await requestFull<T>(config)).data;
}

/** Like request, but also returns the response headers */
async function requestFull<T>(
	config: HttpRequestConfig,
	retried = false,
): Promise<{ data: T; headers: Headers }> {
	const isAuth = config.url?.startsWith("/auth") ?? false;
	// logins and password changes do not change shared data
	if (config.method && config.method !== "GET" && !isAuth) markOwnWrite();
	try {
		const response = await http.request<T>({
			...config,
			url: API_URL + config.url,
		});
		return { data: response.data, headers: response.headers };
	} catch (error) {
		const apiError = toApiError(error);
		// expired access token: get a new one with the refresh token and try once more
		if (apiError.status === 401 && !isAuth && getToken()) {
			if (!retried && (await refreshSession()))
				return requestFull<T>(config, true);
			clearSession();
		}
		throw apiError;
	}
}

let refreshing: Promise<boolean> | null = null;

/**
 * Exchanges the refresh token for a new access token.
 * Parallel callers share one request, because the refresh token is replaced each time.
 */
export function refreshSession(): Promise<boolean> {
	const refreshToken = getRefreshToken();
	if (!refreshToken) return Promise.resolve(false);
	refreshing ??= http
		.request<{ token: string; refreshToken: string; user: User }>({
			url: `${API_URL}/auth/refresh`,
			method: "POST",
			body: { RefreshToken: refreshToken },
		})
		.then(({ data }) => {
			setSession(data.token, data.user, data.refreshToken);
			return true;
		})
		.catch(() => false)
		.finally(() => (refreshing = null));
	return refreshing;
}

const get = <T>(url: string, query?: Record<string, unknown>) =>
	request<T>({ url, method: "GET", query });
const post = <T>(url: string, body: unknown) =>
	request<T>({ url, method: "POST", body: body as HttpRequestConfig["body"] });
const put = <T>(url: string, body: unknown) =>
	request<T>({ url, method: "PUT", body: body as HttpRequestConfig["body"] });
const del = (url: string) =>
	request<{ success: boolean }>({ url, method: "DELETE" });

export interface PersonQuery {
	q?: string;
	living?: boolean;
	born?: string;
	limit?: number;
	offset?: number;
}

export interface Stats {
	Persons: number;
	Families: number;
	Living: number;
	Recent: Person[];
	Birthdays: Person[];
}

export const api = {
	stats: () => get<Stats>("/stats"),
	login: (Email: string, Password: string) =>
		post<{ token: string; refreshToken: string; user: User }>("/auth/login", {
			Email,
			Password,
		}),
	logout: (RefreshToken: string) =>
		post<{ success: boolean }>("/auth/logout", { RefreshToken }),
	authConfig: () => get<{ passwordReset: boolean }>("/auth/config"),
	requestPasswordReset: (Email: string) =>
		post<{ success: boolean }>("/auth/password-reset", { Email }),
	confirmPasswordReset: (Token: string, NewPassword: string) =>
		post<{ success: boolean }>("/auth/password-reset/confirm", {
			Token,
			NewPassword,
		}),
	me: () => get<User>("/auth/me"),
	changePassword: (CurrentPassword: string, NewPassword: string) =>
		put<{ success: boolean }>("/auth/me/password", {
			CurrentPassword,
			NewPassword,
			RefreshToken: getRefreshToken() ?? undefined,
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
		/** One page of persons plus the total number of matches */
		search: async (
			params: PersonQuery = {},
		): Promise<{ items: Person[]; total: number }> => {
			const query = Object.fromEntries(
				Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
			);
			const { data, headers } = await requestFull<Person[]>({
				url: "/persons",
				method: "GET",
				query,
			});
			return {
				items: data,
				total: Number(headers.get("X-Total-Count") ?? data.length),
			};
		},
		/** Exactly these persons (e.g. to show names of related persons) */
		byIds: async (ids: string[]): Promise<Person[]> => {
			const unique = [...new Set(ids)].filter(Boolean);
			return unique.length
				? get<Person[]>("/persons", { ids: unique.join(",") })
				: [];
		},
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

	tokens: {
		list: () => get<ApiToken[]>("/tokens"),
		create: (data: {
			UserId: string;
			Name: string;
			ExpiresInDays: number | null;
		}) => post<ApiToken>("/tokens", data),
		remove: (id: string) => del(`/tokens/${id}`),
	},

	federation: {
		peers: () => get<Peer[]>("/federation/peers"),
		addPeer: (data: {
			Name: string;
			BaseUrl: string;
			Token: string;
			Mutual?: boolean;
			Message?: string;
		}) =>
			post<Peer & { RequestSent: boolean; RequestError: string | null }>(
				"/federation/peers",
				data,
			),
		checkPeer: (id: string) => post<Peer>(`/federation/peers/${id}/check`, {}),
		removePeer: (id: string) => del(`/federation/peers/${id}`),
		search: (peerId: string, q: string) =>
			get<RemotePerson[]>(`/federation/peers/${peerId}/persons`, { q }),
		person: (peerId: string, remoteId: string) =>
			get<RemotePerson>(
				`/federation/peers/${peerId}/persons/${encodeURIComponent(remoteId)}`,
			),
		tree: (peerId: string, remoteId: string, depth = 3) =>
			get<RemoteTree>(
				`/federation/peers/${peerId}/persons/${encodeURIComponent(remoteId)}/tree`,
				{ depth },
			),
		importPerson: (peerId: string, remoteId: string) =>
			post<{ Person: Person; Link: PersonLinkEntry }>(
				`/federation/peers/${peerId}/persons/${encodeURIComponent(remoteId)}/import`,
				{},
			),
		requests: () => get<PeerRequest[]>("/federation/requests"),
		acceptRequest: (id: string) =>
			post<Peer>(`/federation/requests/${id}/accept`, {}),
		declineRequest: (id: string) => del(`/federation/requests/${id}`),
		links: (personId: string) =>
			get<PersonLinkEntry[]>("/federation/links", { personId }),
		addLink: (data: {
			PersonId: string;
			PeerId: string;
			RemotePersonId: string;
			Relation: LinkRelation;
			Notes: string;
		}) => post<PersonLinkEntry>("/federation/links", data),
		removeLink: (id: string) => del(`/federation/links/${id}`),
	},

	gedcom: {
		import: (file: File, familyName?: string) => {
			const form = new FormData();
			form.set("file", file);
			return request<{
				Persons: number;
				Relationships: number;
				Media: number;
				FamilyId: string | null;
				Warnings: string[];
			}>({
				url: "/gedcom/import",
				method: "POST",
				body: form,
				query: familyName ? { family: familyName } : undefined,
			});
		},
		export: (withMedia = false) =>
			request<Blob>({
				url: "/gedcom/export",
				method: "GET",
				query: withMedia ? { format: "zip" } : undefined,
				parseAs: "blob",
			}),
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

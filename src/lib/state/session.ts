import { computed, persistedSignal } from "@bquery/bquery/reactive";
import type { Role, User } from "../api/types";
import { fromSignal } from "./svelte";

interface Session {
	token: string;
	user: User;
}

const LEVEL: Record<Role, number> = { Viewer: 1, Editor: 2, Admin: 3 };

/** Login session, persisted in localStorage */
export const sessionSignal = persistedSignal<Session | null>(
	"fc.session",
	null,
);

export const userSignal = computed(() => sessionSignal.value?.user ?? null);

export const session = fromSignal(sessionSignal);
export const currentUser = fromSignal(userSignal);
export const canEdit = fromSignal(computed(() => hasRole("Editor")));
export const isAdmin = fromSignal(computed(() => hasRole("Admin")));

export function hasRole(required: Role): boolean {
	const user = sessionSignal.value?.user;
	return !!user && LEVEL[user.Role] >= LEVEL[required];
}

export function getToken(): string | null {
	return sessionSignal.peek()?.token ?? null;
}

export function setSession(token: string, user: User): void {
	sessionSignal.value = { token, user };
}

export function updateUser(user: User): void {
	const current = sessionSignal.peek();
	if (current) sessionSignal.value = { ...current, user };
}

export function clearSession(): void {
	sessionSignal.value = null;
}

import { createRouter, type Route } from "@bquery/bquery/router";
import type { Component } from "svelte";
import type { Role } from "./api/types";
import { fromSignal } from "./state/svelte";
import Dashboard from "../pages/Dashboard.svelte";
import Persons from "../pages/Persons.svelte";
import PersonDetail from "../pages/PersonDetail.svelte";
import PersonEdit from "../pages/PersonEdit.svelte";
import Tree from "../pages/Tree.svelte";
import Families from "../pages/Families.svelte";
import FamilyDetail from "../pages/FamilyDetail.svelte";
import Users from "../pages/Users.svelte";
import Account from "../pages/Account.svelte";
import NotFound from "../pages/NotFound.svelte";
import Gedcom from "../pages/Gedcom.svelte";
import ResetPassword from "../pages/ResetPassword.svelte";

// Pages either take `params` or no props at all
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Page = Component<any>;

export interface PageMeta extends Record<string, unknown> {
	page: Page;
	/** i18n key of the page title */
	title: string;
	role?: Role;
}

const route = (
	path: string,
	page: PageMeta["page"],
	title: string,
	role?: Role,
) => ({
	path,
	// bQuery only stores the component, rendering is done by Svelte (see App.svelte)
	component: () => page,
	meta: { page, title, role } satisfies PageMeta,
});

export const router = createRouter({
	hash: true,
	routes: [
		route("/", Dashboard, "titles.dashboard"),
		route("/persons", Persons, "titles.persons"),
		route("/persons/new", PersonEdit, "titles.newPerson", "Editor"),
		route("/persons/:id", PersonDetail, "titles.person"),
		route("/persons/:id/edit", PersonEdit, "titles.editPerson", "Editor"),
		route("/persons/:id/tree", Tree, "titles.tree"),
		route("/families", Families, "titles.families"),
		route("/families/:id", FamilyDetail, "titles.family"),
		route("/users", Users, "titles.users", "Admin"),
		route("/account", Account, "titles.account"),
		route("/gedcom", Gedcom, "titles.gedcom", "Editor"),
		route("/reset-password", ResetPassword, "titles.resetPassword"),
		route("*", NotFound, "titles.notFound"),
	],
});

/** Current route as Svelte store */
export const currentRoute = fromSignal<Route>(router.currentRoute);

export const go = (path: string) => router.push(path);

/** href for links in hash mode */
export const href = (path: string) => `#${path}`;

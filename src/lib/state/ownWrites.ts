/** Remembers when this tab changed data, so its own changes are not announced as foreign ones */
let ownWriteUntil = 0;

export function markOwnWrite(): void {
	ownWriteUntil = Date.now() + 2000;
}

export const isOwnWrite = () => Date.now() < ownWriteUntil;

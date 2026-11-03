import { describe, expect, it } from "vitest";
import { formatDate, parseDateInput, splitNames } from "./format";

describe("format", () => {
	it("formats partial dates", () => {
		expect(formatDate("1901")).toBe("1901");
		expect(formatDate("1901-04")).toBe("04.1901");
		expect(formatDate("1901-04-12")).toBe("12.04.1901");
		expect(formatDate(null)).toBe("");
	});

	it("parses German and ISO date input", () => {
		expect(parseDateInput("")).toBeNull();
		expect(parseDateInput("1901")).toBe("1901");
		expect(parseDateInput("12.4.1901")).toBe("1901-04-12");
		expect(parseDateInput("04.1901")).toBe("1901-04");
		expect(parseDateInput("1901-04-12")).toBe("1901-04-12");
		expect(parseDateInput("gestern")).toBeUndefined();
	});

	it("splits names", () => {
		expect(splitNames("  Anna   Maria ")).toEqual(["Anna", "Maria"]);
	});
});

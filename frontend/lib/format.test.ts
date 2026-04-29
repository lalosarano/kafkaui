import { describe, expect, it } from "vitest";
import { fmt } from "./format";

describe("fmt.num", () => {
  it("returns — for null", () => expect(fmt.num(null)).toBe("—"));
  it("returns plain string for small ints", () => expect(fmt.num(42)).toBe("42"));
  it("formats thousands with K suffix", () => expect(fmt.num(12_345)).toBe("12.3K"));
  it("formats millions with M suffix", () => expect(fmt.num(1_500_000)).toBe("1.50M"));
});

describe("fmt.bytes (input is MB)", () => {
  it("renders KB", () => expect(fmt.bytes(0.5)).toBe("512 KB"));
  it("renders MB", () => expect(fmt.bytes(42)).toBe("42.0 MB"));
  it("renders GB", () => expect(fmt.bytes(2048)).toBe("2.00 GB"));
});

describe("fmt.ms", () => {
  it("returns Forever for -1", () => expect(fmt.ms(-1)).toBe("Forever"));
  it("renders days", () => expect(fmt.ms(86_400_000 * 7)).toBe("7d"));
  it("renders hours", () => expect(fmt.ms(3600_000 * 5)).toBe("5h"));
});

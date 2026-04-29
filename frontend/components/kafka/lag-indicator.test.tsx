import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LagIndicator } from "./lag-indicator";

describe("LagIndicator", () => {
  it("uses the green tone for lag=0", () => {
    const { container } = render(<LagIndicator lag={0} />);
    expect(container.querySelector(".bg-green")).toBeTruthy();
  });
  it("uses the amber tone for moderate lag", () => {
    const { container } = render(<LagIndicator lag={5_000} />);
    expect(container.querySelector(".bg-amber")).toBeTruthy();
  });
  it("uses the red tone for huge lag", () => {
    const { container } = render(<LagIndicator lag={1_000_000} />);
    expect(container.querySelector(".bg-red")).toBeTruthy();
  });
});

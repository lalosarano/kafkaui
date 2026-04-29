import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("renders Stable for 'stable'", () => {
    render(<StatusBadge state="stable" />);
    expect(screen.getByText("Stable")).toBeInTheDocument();
  });
  it("renders Dead for 'dead'", () => {
    render(<StatusBadge state="dead" />);
    expect(screen.getByText("Dead")).toBeInTheDocument();
  });
  it("falls back to the raw state for unknown values", () => {
    render(<StatusBadge state="weird-state" />);
    expect(screen.getByText("weird-state")).toBeInTheDocument();
  });
});

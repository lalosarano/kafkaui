import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./data-table";

type Row = { name: string; n: number };

const columns: ColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "n", header: "Count", meta: { align: "right" } },
];

describe("DataTable", () => {
  it("renders rows", () => {
    render(<DataTable columns={columns} data={[{ name: "a", n: 1 }, { name: "b", n: 2 }]} />);
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
  });

  it("calls onRowClick", () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={[{ name: "a", n: 1 }]} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText("a"));
    expect(onRowClick).toHaveBeenCalledWith({ name: "a", n: 1 });
  });

  it("shows empty state when there are no rows", () => {
    render(<DataTable columns={columns} data={[]} emptyState="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});

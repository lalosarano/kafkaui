"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsUpDown, ArrowUp, ArrowDown } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  globalFilter?: string;
  onGlobalFilterChange?: (s: string) => void;
  onRowClick?: (row: TData) => void;
  initialSort?: SortingState;
  pageSize?: number;
  emptyState?: React.ReactNode;
  density?: "compact" | "comfortable";
}

export function DataTable<TData, TValue>({
  columns,
  data,
  globalFilter = "",
  onRowClick,
  initialSort = [],
  pageSize = 50,
  emptyState,
  density = "compact",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSort);
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const rows = table.getRowModel().rows;
  const padY = density === "compact" ? "py-1.5" : "py-2.5";

  return (
    <div className="overflow-hidden rounded-3 border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  const dir = header.column.getIsSorted();
                  const align = (header.column.columnDef.meta as { align?: "left" | "right" } | undefined)?.align ?? "left";
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "select-none whitespace-nowrap border-b border-border bg-bg-2 px-3 py-1.5 text-[11.5px] font-medium tracking-wide text-fg-3",
                        align === "right" && "text-right",
                        align === "left" && "text-left",
                        sortable && "cursor-pointer hover:text-fg",
                      )}
                      onClick={sortable ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sortable && (
                          <span className={cn("text-fg-4", dir && "text-accent")}>
                            {dir === "asc" ? <ArrowUp className="h-2.5 w-2.5" /> : dir === "desc" ? <ArrowDown className="h-2.5 w-2.5" /> : <ChevronsUpDown className="h-2.5 w-2.5" />}
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-12 text-center text-fg-3">
                  {emptyState ?? "No results"}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "cursor-pointer border-b border-border-soft last:border-b-0 transition-colors hover:bg-bg-hover",
                  !onRowClick && "cursor-default",
                )}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => {
                  const align = (cell.column.columnDef.meta as { align?: "left" | "right" } | undefined)?.align ?? "left";
                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        "whitespace-nowrap px-3 align-middle",
                        padY,
                        align === "right" && "text-right",
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > pageSize && (
        <div className="flex items-center justify-between border-t border-border bg-bg-2 px-3 py-2 text-[12px] text-fg-3">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page">
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page">
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { LuChevronDown as ChevronDown, LuChevronsUpDown as ChevronsUpDown } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/ui/dropdown";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EmptyState,
  TableShell,
  tableCellClass,
  tableHeadClass,
  tableRowClass,
} from "./ui";

type SortDir = "asc" | "desc";

type SelectFilter<T> = {
  type: "select";
  options: { value: string; label: string }[];
  match: (row: T, value: string) => boolean;
};

type TextFilter<T> = {
  type: "text";
  accessor: (row: T) => string;
};

export type DataTableColumn<T> = {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: "right";
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number;
  filter?: TextFilter<T> | SelectFilter<T>;
  skeleton?: React.ReactNode;
};

type SortCriterion = { id: string; dir: SortDir };

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  minWidth,
  emptyTitle,
  emptyFilteredTitle,
  skeletonRows = 6,
  initialSort,
  onVisibleRowsChange,
}: {
  rows: T[] | null | undefined;
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  minWidth?: string;
  emptyTitle: string;
  emptyFilteredTitle?: string;
  skeletonRows?: number;
  initialSort?: SortCriterion[];
  onVisibleRowsChange?: (rows: T[]) => void;
}) {
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [sorts, setSorts] = React.useState<SortCriterion[]>(initialSort ?? []);

  const columnById = React.useMemo(() => {
    const map = new Map<string, DataTableColumn<T>>();
    for (const col of columns) map.set(col.id, col);
    return map;
  }, [columns]);

  const hasFilters = columns.some((col) => col.filter);

  const filtersActive = Object.values(filters).some((v) => v && v !== "all");
  const sortActive = sorts.length > 0;

  const visible = React.useMemo(() => {
    const list = (rows ?? []).filter((row) => {
      for (const col of columns) {
        if (!col.filter) continue;
        const raw = filters[col.id];
        if (!raw) continue;
        if (col.filter.type === "text") {
          const needle = raw.trim().toLowerCase();
          if (needle && !col.filter.accessor(row).toLowerCase().includes(needle)) return false;
        } else if (raw !== "all" && !col.filter.match(row, raw)) {
          return false;
        }
      }
      return true;
    });

    const active = sorts.length > 0 ? sorts : initialSort ?? [];
    if (active.length === 0) return list;

    return [...list].sort((a, b) => {
      for (const { id, dir } of active) {
        const accessor = columnById.get(id)?.sortAccessor;
        if (!accessor) continue;
        const av = accessor(a);
        const bv = accessor(b);
        let cmp = 0;
        if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
        else cmp = String(av).localeCompare(String(bv));
        if (cmp !== 0) return cmp * (dir === "asc" ? 1 : -1);
      }
      return 0;
    });
  }, [rows, columns, filters, sorts, initialSort, columnById]);

  React.useEffect(() => {
    onVisibleRowsChange?.(visible);
  }, [visible, onVisibleRowsChange]);

  const toggleSort = (id: string) =>
    setSorts((prev) => {
      const existing = prev.find((s) => s.id === id);
      if (!existing) return [...prev, { id, dir: "desc" }];
      if (existing.dir === "desc") return prev.map((s) => (s.id === id ? { id, dir: "asc" } : s));
      return prev.filter((s) => s.id !== id);
    });

  const setFilter = (id: string, value: string) =>
    setFilters((prev) => ({ ...prev, [id]: value }));

  return (
    <>
      {filtersActive || sortActive ? (
        <div className="mb-2 flex min-h-5 items-center justify-end gap-4">
          {filtersActive ? (
            <button
              type="button"
              onClick={() => setFilters({})}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear filters
            </button>
          ) : null}
          {sortActive ? (
            <button
              type="button"
              onClick={() => setSorts([])}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear sort
            </button>
          ) : null}
        </div>
      ) : null}

      <TableShell minWidth={minWidth}>
        <thead className={tableHeadClass}>
          <tr>
            {columns.map((col) => {
              const index = sorts.findIndex((s) => s.id === col.id);
              const active = index >= 0;
              const dir = active ? sorts[index].dir : null;
              const showRank = active && sorts.length > 1;
              return (
                <th
                  key={col.id}
                  scope="col"
                  className={cn(
                    `${tableCellClass} font-medium`,
                    col.align === "right" && "text-right",
                    col.headerClassName,
                  )}
                  aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      title="Click to sort. Click again to reverse, once more to remove."
                      onClick={() => toggleSort(col.id)}
                      className={cn(
                        "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                        active && "text-foreground",
                      )}
                    >
                      {col.header}
                      {active ? (
                        <ChevronDown
                          className={cn("h-3.5 w-3.5 transition-transform", dir === "asc" && "rotate-180")}
                        />
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                      )}
                      {showRank ? (
                        <span className="grid h-4 min-w-4 place-items-center rounded-full bg-secondary px-1 text-[10px] font-semibold tabular-nums text-muted-foreground">
                          {index + 1}
                        </span>
                      ) : null}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
          {hasFilters ? (
            <tr>
              {columns.map((col) => (
                <th key={col.id} className="px-4 pb-3 align-top">
                  {col.filter?.type === "text" ? (
                    <input
                      type="text"
                      aria-label={`Filter by ${col.id}`}
                      placeholder="Filter"
                      value={filters[col.id] ?? ""}
                      onChange={(e) => setFilter(col.id, e.target.value)}
                      className="h-8 w-full min-w-[80px] rounded-md border border-border bg-background px-2 text-xs font-normal text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15"
                    />
                  ) : col.filter?.type === "select" ? (
                    <Dropdown
                      ariaLabel={`Filter by ${col.id}`}
                      value={filters[col.id] ?? "all"}
                      onSelect={(v) => setFilter(col.id, v)}
                      options={col.filter.options}
                      radio
                      triggerClassName="h-8 w-full rounded-md px-2 text-xs font-normal"
                      listClassName="max-h-none overflow-visible"
                    />
                  ) : null}
                </th>
              ))}
            </tr>
          ) : null}
        </thead>
        <tbody>
          {!rows ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i} className="border-b-2 border-border/50 last:border-0">
                {columns.map((col) => (
                  <td key={col.id} className={tableCellClass}>
                    {col.skeleton ?? <Skeleton className="h-4 w-20" />}
                  </td>
                ))}
              </tr>
            ))
          ) : visible.length > 0 ? (
            visible.map((row) => (
              <tr key={getRowKey(row)} className={cn("align-top", tableRowClass)}>
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn(tableCellClass, col.align === "right" && "text-right", col.className)}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10">
                <EmptyState title={filtersActive ? emptyFilteredTitle ?? emptyTitle : emptyTitle} />
              </td>
            </tr>
          )}
        </tbody>
      </TableShell>
    </>
  );
}

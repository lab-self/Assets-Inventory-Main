import { useEffect, useMemo, useState, type ReactNode } from "react";

export type Column<T> = { label: string; value: (row: T) => string | number; render?: (row: T) => ReactNode; sortValue?: (row: T) => string | number };

export function DataTable<T>({ rows, columns, rowKey, title, defaultPageSize = 25, filters = [], actions }: {
  rows: T[]; columns: Column<T>[]; rowKey: (row: T) => string; title: string; defaultPageSize?: number;
  filters?: string[]; actions?: (filteredRows: T[]) => ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState({ column: "", descending: false });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const filtered = useMemo(() => {
    const result = rows.filter(row => columns.some(column => String(column.value(row)).toLowerCase().includes(search.trim().toLowerCase())) &&
      columns.every(column => !selectedFilters[column.label] || String(column.value(row)) === selectedFilters[column.label]));
    const column = columns.find(column => column.label === sort.column);
    if (column) result.sort((a, b) => {
      const left = (column.sortValue || column.value)(a), right = (column.sortValue || column.value)(b);
      const comparison = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
      return sort.descending ? -comparison : comparison;
    });
    return result;
  }, [rows, columns, search, selectedFilters, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  useEffect(() => { setPage(1); }, [search, selectedFilters, pageSize, sort]);
  return <section className="data-table-section" aria-label={title}>
    <div className="table-controls no-print">
      <label>Search<input type="search" aria-label={`Search ${title}`} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all columns" /></label>
      {filters.map(label => {
        const column = columns.find(column => column.label === label)!;
        return <label key={label}>{label}<select aria-label={`Filter ${label}`} value={selectedFilters[label] || ""} onChange={e => setSelectedFilters({ ...selectedFilters, [label]: e.target.value })}>
          <option value="">All</option>{[...new Set(rows.map(row => String(column.value(row))))].sort().map(value => <option key={value}>{value}</option>)}
        </select></label>;
      })}
      <label>Rows per page<select aria-label={`Rows per page ${title}`} value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>{[...new Set([10, 25, 50, 100, defaultPageSize])].sort((a, b) => a - b).map(size => <option key={size}>{size}</option>)}</select></label>
    </div>
    {actions?.(filtered)}
    <div className="table-wrap" tabIndex={0} role="region" aria-label={`${title} table`}>
      <table><caption className="sr-only">{title}</caption><thead><tr>{columns.map(column => <th key={column.label} scope="col" aria-sort={sort.column === column.label ? sort.descending ? "descending" : "ascending" : "none"}>
        {column.label === "Actions" ? column.label : <button type="button" className="sort-button" onClick={() => setSort({ column: column.label, descending: sort.column === column.label && !sort.descending })}>{column.label}{sort.column === column.label ? sort.descending ? " ↓" : " ↑" : ""}</button>}
      </th>)}</tr></thead><tbody>{filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(row => <tr key={rowKey(row)}>{columns.map(column => <td key={column.label}>{column.render ? column.render(row) : column.value(row)}</td>)}</tr>)}</tbody></table>
    </div>
    {!filtered.length && <p role="status">No matching records.</p>}
    <div className="pagination no-print"><button type="button" className="secondary-button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pages} · {filtered.length} records</span><button type="button" className="secondary-button" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Next</button></div>
  </section>;
}

export function capacity(gb: unknown, unit: unknown = "GB") {
  if (gb == null || gb === "" || !Number.isFinite(Number(gb))) return "—";
  return `${Number(gb) / (unit === "TB" ? 1024 : 1)} ${unit === "TB" ? "TB" : "GB"}`;
}
export function storageLabel(value: unknown) {
  return ({ nvme: "NVMe SSD", sata_ssd: "SATA SSD", ssd: "SSD", hdd: "HDD", hybrid: "Hybrid", none: "—" } as Record<string, string>)[String(value)] || String(value || "—");
}

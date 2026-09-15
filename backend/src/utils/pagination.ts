import type { PaginationMeta } from "../types/common.js";

export interface NormalizedPagination {
  page: number;
  pageSize: number;
  offset: number;
}

export function normalizePagination(
  page: number | undefined,
  pageSize: number | undefined,
  maxPageSize: number
): NormalizedPagination {
  const normalizedPage = Math.max(
    1,
    Math.floor(page ?? 1)
  );

  const normalizedPageSize = Math.min(
    maxPageSize,
    Math.max(
      1,
      Math.floor(pageSize ?? 25)
    )
  );

  return {
    page: normalizedPage,
    pageSize: normalizedPageSize,
    offset:
      (normalizedPage - 1) *
      normalizedPageSize
  };
}

export function createPaginationMeta(
  page: number,
  pageSize: number,
  total: number
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages:
      total === 0
        ? 0
        : Math.ceil(total / pageSize)
  };
}
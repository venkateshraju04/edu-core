import { Request } from 'express';

export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Extract page & limit from query params and compute offset.
 * Defaults: page=1, limit=20, max limit=100
 */
export function getPagination(req: Request): PaginationOptions {
  const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

export function buildMeta(page: number, limit: number, total: number): PaginatedMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

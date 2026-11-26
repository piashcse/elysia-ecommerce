import { PAGINATION } from '../core/constants';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_REGEX.test(value);

export const getPagination = (query: { page?: unknown; limit?: unknown }) => {
  const rawPage = Number(query.page ?? PAGINATION.DEFAULT_PAGE);
  const rawLimit = Number(query.limit ?? PAGINATION.DEFAULT_LIMIT);
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.trunc(rawPage)) : PAGINATION.DEFAULT_PAGE;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Math.trunc(rawLimit)))
    : PAGINATION.DEFAULT_LIMIT;

  return { page, limit, offset: (page - 1) * limit };
};

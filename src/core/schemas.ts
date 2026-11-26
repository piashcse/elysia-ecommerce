import { t } from 'elysia';
import { PAGINATION } from './constants';

export const uuid = t.String({ format: 'uuid' });
export const idParams = t.Object({ id: uuid });

export const paginationQuery = t.Object({
  page: t.Optional(t.Integer({ minimum: 1 })),
  limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
});

import { Elysia, t } from 'elysia';
import { SearchService } from '../service/SearchService';
import { successResponse, successSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';
import { idParams } from '../../../core/schemas';

const service = new SearchService();

export const searchController = new Elysia({ prefix: '/admin/search', tags: ['Search'] })
  .use(authPlugin)
  .get('/synonyms', {
    hasRole: UserRole.ADMIN,
    response: { 200: successSchema() },
    detail: { summary: 'List search synonyms (Admin only)' }
  }, async () => successResponse(await service.listSynonyms(), 'Search synonyms retrieved successfully'))
  .post('/synonyms', {
    hasRole: UserRole.ADMIN,
    body: t.Object({
      term: t.String({ minLength: 1, maxLength: 100 }),
      synonyms: t.Array(t.String({ minLength: 1, maxLength: 100 }), { minItems: 1, maxItems: 50 }),
    }),
    response: { 201: successSchema(), 422: errorSchema },
    detail: { summary: 'Create or replace a search synonym mapping (Admin only)' }
  }, async ({ body, set }) => {
    const record = await service.upsertSynonym(body.term, body.synonyms);
    set.status = 201;
    return successResponse(record, 'Search synonym saved successfully', 201);
  })
  .delete('/synonyms/:id', {
    hasRole: UserRole.ADMIN,
    params: idParams,
    response: { 200: successSchema(), 404: errorSchema },
    detail: { summary: 'Delete a search synonym mapping (Admin only)' }
  }, async ({ params }) => successResponse(await service.deleteSynonym(params.id), 'Search synonym deleted successfully'));

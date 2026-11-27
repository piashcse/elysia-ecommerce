import { Elysia, t } from 'elysia';
import { ApiKeyService } from '../service/ApiKeyService';
import { successResponse, successSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { idParams } from '../../../core/schemas';

const service = new ApiKeyService();

export const apiKeyController = new Elysia({ prefix: '/api-keys', tags: ['Auth'] })
  .use(authPlugin)
  .guard({ isAuth: true })
  .get('/', {
    response: { 200: successSchema() },
    detail: { summary: 'List API keys' }
  }, async ({ user }) => successResponse(await service.list(user!.sub), 'API keys retrieved successfully'))
  .post('/', {
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 100 }),
      scopes: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 50 })),
    }),
    response: { 201: successSchema(), 422: errorSchema },
    detail: { summary: 'Create an API key' }
  }, async ({ user, body, set }) => {
    const record = await service.create(user!.sub, body.name, body.scopes);
    set.status = 201;
    return successResponse(record, 'API key created successfully', 201);
  })
  .delete('/:id', {
    params: idParams,
    response: { 200: successSchema(), 404: errorSchema },
    detail: { summary: 'Revoke an API key' }
  }, async ({ user, params }) => {
    await service.revoke(user!.sub, params.id);
    return successResponse(null, 'API key revoked successfully');
  });

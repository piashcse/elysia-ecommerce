import { Elysia, t } from 'elysia';
import { ProductQaService } from '../service/ProductQaService';
import { successResponse, successSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { idParams } from '../../../core/schemas';

const service = new ProductQaService();

export const productQaController = new Elysia({ tags: ['Product'] })
  .use(authPlugin)
  .get('/products/:id/questions', {
    params: idParams,
    response: { 200: successSchema(), 404: errorSchema },
    detail: { summary: 'List product questions and answers' }
  }, async ({ params }) => successResponse(await service.list(params.id), 'Questions retrieved successfully'))
  .post('/products/:id/questions', {
    params: idParams,
    isAuth: true,
    body: t.Object({ question: t.String({ minLength: 5, maxLength: 2000 }) }),
    response: { 201: successSchema(), 404: errorSchema, 422: errorSchema },
    detail: { summary: 'Ask a product question' }
  }, async ({ params, body, user, set }) => {
    const record = await service.ask(user!.sub, params.id, body.question);
    set.status = 201;
    return successResponse(record, 'Question submitted successfully', 201);
  })
  .post('/questions/:id/answers', {
    params: idParams,
    isAuth: true,
    body: t.Object({ answer: t.String({ minLength: 1, maxLength: 5000 }) }),
    response: { 201: successSchema(), 403: errorSchema, 404: errorSchema },
    detail: { summary: 'Answer a product question (seller/admin)' }
  }, async ({ params, body, user, set }) => {
    const record = await service.answer(user as any, params.id, body.answer);
    set.status = 201;
    return successResponse(record, 'Answer submitted successfully', 201);
  });

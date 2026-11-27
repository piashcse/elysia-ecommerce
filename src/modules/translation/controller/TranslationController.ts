import { Elysia, t } from 'elysia';
import { TranslationService } from '../service/TranslationService';
import { ProductService } from '../../product/service/ProductService';
import { CategoryService } from '../../category/service/CategoryService';
import { successResponse, successSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';
import { idParams } from '../../../core/schemas';

const service = new TranslationService();
const products = new ProductService();
const categories = new CategoryService();

const localeParam = t.String({ minLength: 2, maxLength: 10, pattern: '^[a-zA-Z]{2}(-[a-zA-Z]{2})?$' });
const translationBody = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  description: t.Optional(t.String({ maxLength: 5000 })),
  metaTitle: t.Optional(t.String({ maxLength: 200 })),
  metaDescription: t.Optional(t.String({ maxLength: 500 })),
});

export const translationController = new Elysia({ tags: ['Translation'] })
  .use(authPlugin)
  .get('/products/:id/translations', {
    params: idParams,
    response: { 200: successSchema() },
    detail: { summary: 'List product translations' }
  }, async ({ params }) => successResponse(await service.listProductTranslations(params.id), 'Product translations retrieved successfully'))
  .put('/products/:id/translations/:locale', {
    params: t.Object({ id: t.String({ format: 'uuid' }), locale: localeParam }),
    body: translationBody,
    hasRole: [UserRole.ADMIN, UserRole.SELLER],
    response: { 200: successSchema(), 403: errorSchema, 404: errorSchema },
    detail: { summary: 'Create or update a product translation' }
  }, async ({ params, body, user }) => {
    await products.getManageableProduct(user as any, params.id);
    const record = await service.upsertProductTranslation(params.id, params.locale, body);
    return successResponse(record, 'Product translation saved successfully');
  })
  .delete('/products/:id/translations/:locale', {
    params: t.Object({ id: t.String({ format: 'uuid' }), locale: localeParam }),
    hasRole: [UserRole.ADMIN, UserRole.SELLER],
    response: { 200: successSchema(), 403: errorSchema },
    detail: { summary: 'Delete a product translation' }
  }, async ({ params, user }) => {
    await products.getManageableProduct(user as any, params.id);
    await service.deleteProductTranslation(params.id, params.locale);
    return successResponse(null, 'Product translation deleted successfully');
  })
  .get('/categories/:id/translations', {
    params: idParams,
    response: { 200: successSchema() },
    detail: { summary: 'List category translations' }
  }, async ({ params }) => successResponse(await service.listCategoryTranslations(params.id), 'Category translations retrieved successfully'))
  .put('/categories/:id/translations/:locale', {
    params: t.Object({ id: t.String({ format: 'uuid' }), locale: localeParam }),
    body: translationBody,
    hasRole: UserRole.ADMIN,
    response: { 200: successSchema(), 404: errorSchema },
    detail: { summary: 'Create or update a category translation (Admin only)' }
  }, async ({ params, body }) => {
    await categories.findByIdOrFail(params.id, 'Category');
    const record = await service.upsertCategoryTranslation(params.id, params.locale, body);
    return successResponse(record, 'Category translation saved successfully');
  })
  .delete('/categories/:id/translations/:locale', {
    params: t.Object({ id: t.String({ format: 'uuid' }), locale: localeParam }),
    hasRole: UserRole.ADMIN,
    response: { 200: successSchema() },
    detail: { summary: 'Delete a category translation (Admin only)' }
  }, async ({ params }) => {
    await categories.findByIdOrFail(params.id, 'Category');
    await service.deleteCategoryTranslation(params.id, params.locale);
    return successResponse(null, 'Category translation deleted successfully');
  });

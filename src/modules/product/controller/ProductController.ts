import { Elysia, t } from 'elysia';
import { ProductService } from '../service/ProductService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { idParams, uuid } from '../../../core/schemas';
import { UserRole } from '../../../core/roles';
import { NotFoundError } from '../../../core/errors';
import { PAGINATION } from '../../../core/constants';
import { getPagination } from '../../../utils/validation';

const productService = new ProductService();

const imageBody = t.Object({
  imageUrl: t.String({ format: 'uri', maxLength: 500 }),
  altText: t.Optional(t.String({ maxLength: 255 })),
  displayOrder: t.Optional(t.Integer({ minimum: 0 })),
  isPrimary: t.Optional(t.Boolean()),
});

const variantBody = t.Object({
  sku: t.String({ minLength: 1, maxLength: 100 }),
  name: t.String({ minLength: 1, maxLength: 200 }),
  price: t.Number({ minimum: 0 }),
  stockQuantity: t.Integer({ minimum: 0 }),
  imageUrl: t.Optional(t.String({ format: 'uri', maxLength: 500 })),
  isActive: t.Optional(t.Boolean()),
  attributes: t.Optional(t.Array(t.Object({
    name: t.String({ minLength: 1, maxLength: 100 }),
    value: t.String({ minLength: 1, maxLength: 100 }),
  }))),
});

export const productController = new Elysia({ prefix: '/products', tags: ['Product'] })
  .use(authPlugin)
  .post('/', {
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 255 }),
      slug: t.Optional(t.String({ maxLength: 280 })),
      description: t.Optional(t.String({ maxLength: 5000 })),
      metaTitle: t.Optional(t.String({ maxLength: 200 })),
      metaDescription: t.Optional(t.String({ maxLength: 500 })),
      price: t.Number({ minimum: 0 }),
      imageUrl: t.Optional(t.String({ format: 'uri', maxLength: 500 })),
      stockQuantity: t.Integer({ minimum: 0 }),
      weightGrams: t.Optional(t.Integer({ minimum: 0 })),
      sku: t.String({ minLength: 1, maxLength: 100 }),
      isActive: t.Optional(t.Boolean()),
      categoryId: t.Optional(uuid),
      brandId: t.Optional(uuid),
      sellerId: uuid,
    }),
    hasRole: UserRole.ADMIN,
    response: {
      201: successSchema(),
      400: errorSchema,
      422: errorSchema
    },
    detail: { summary: 'Create a new product (Admin only)' }
  }, async ({ body, set }) => {
    const product = await productService.createProduct(body as any);
    set.status = 201;
    return successResponse(product, 'Product created successfully', 201);
  })

  .get('/', {
    query: t.Object({
      search: t.Optional(t.String({ maxLength: 200 })),
      category: t.Optional(uuid),
      brandId: t.Optional(uuid),
      sellerId: t.Optional(uuid),
      minPrice: t.Optional(t.Number({ minimum: 0 })),
      maxPrice: t.Optional(t.Number({ minimum: 0 })),
      inStock: t.Optional(t.Boolean()),
      isActive: t.Optional(t.Boolean()),
      sortBy: t.Optional(t.Union([
        t.Literal('name'),
        t.Literal('price'),
        t.Literal('createdAt'),
        t.Literal('updatedAt'),
      ])),
      sortOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
      locale: t.Optional(t.String({ minLength: 2, maxLength: 10 })),
      currency: t.Optional(t.String({ minLength: 3, maxLength: 3 })),
      page: t.Optional(t.Integer({ minimum: 1 })),
      limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
    }),
    response: {
      200: paginatedSchema()
    },
    detail: { summary: 'Get all products with filters' }
  }, async ({ query, user }) => {
    const { page, limit } = getPagination(query);
    const isAdmin = user?.role === UserRole.ADMIN;
  
    const filters = {
      search: query.search,
      category: query.category,
      brandId: query.brandId,
      sellerId: query.sellerId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      inStock: query.inStock,
      // Public catalog never exposes inactive products by default.
      isActive: isAdmin ? query.isActive : true,
      sortBy: query.sortBy as any,
      sortOrder: query.sortOrder as any,
      locale: query.locale,
      currency: query.currency,
    };
  
    const { items, total } = await productService.getAllProducts(page, limit, filters);
  
    return paginatedResponse(items, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }, 'Products retrieved successfully');
  })

  .get('/facets', {
    response: { 200: successSchema() },
    detail: { summary: 'Get catalog facets' }
  }, async () => successResponse(await productService.getFacets(), 'Facets retrieved successfully'))
  .get('/slug/:slug', {
    params: t.Object({ slug: t.String({ maxLength: 280 }) }),
    query: t.Object({
      locale: t.Optional(t.String({ minLength: 2, maxLength: 10 })),
      currency: t.Optional(t.String({ minLength: 3, maxLength: 3 })),
    }),
    response: { 200: successSchema(), 404: errorSchema },
    detail: { summary: 'Get a product by slug' }
  }, async ({ params, query, user }) => {
    const product = await productService.getBySlug(params.slug, user?.role === UserRole.ADMIN, query.locale, query.currency);
    if (!product) throw new NotFoundError('Product not found');
    return successResponse(product, 'Product retrieved successfully');
  })
  .get('/:id/related', {
    params: idParams,
    query: t.Object({
      limit: t.Optional(t.Integer({ minimum: 1, maximum: 20 })),
      locale: t.Optional(t.String({ minLength: 2, maxLength: 10 })),
      currency: t.Optional(t.String({ minLength: 3, maxLength: 3 })),
    }),
    response: { 200: successSchema(), 404: errorSchema },
    detail: { summary: 'Get related products' }
  }, async ({ params, query }) => successResponse(await productService.getRelated(params.id, query.limit, query.locale, query.currency), 'Related products retrieved successfully'))
  .get('/:id', {
    params: idParams,
    query: t.Object({
      locale: t.Optional(t.String({ minLength: 2, maxLength: 10 })),
      currency: t.Optional(t.String({ minLength: 3, maxLength: 3 })),
    }),
    response: {
      200: successSchema(),
      404: errorSchema
    },
    detail: { summary: 'Get product by ID' }
  }, async ({ params, query, user }) => {
    const isAdmin = user?.role === UserRole.ADMIN;
    const product = await productService.findProductByIdWithDetails(params.id, isAdmin, query.locale, query.currency);
    if (!product) throw new NotFoundError('Product not found');
    return successResponse(product, 'Product retrieved successfully');
  })

  .get('/:id/images', {
    params: idParams,
    response: { 200: successSchema() },
    detail: { summary: 'Get product images' }
  }, async ({ params }) => {
    const images = await productService.getImages(params.id);
    return successResponse(images, 'Product images retrieved successfully');
  })

  .post('/:id/images', {
    params: idParams,
    body: imageBody,
    isAuth: true,
    response: { 200: successSchema(), 403: errorSchema, 404: errorSchema },
    detail: { summary: 'Add a product image (Admin or owning seller)' }
  }, async ({ params, body, user }) => {
    const image = await productService.addImage(user as any, params.id, body);
    return successResponse(image, 'Product image added successfully');
  })

  .put('/images/:imageId', {
    params: t.Object({ imageId: uuid }),
    body: t.Partial(imageBody),
    isAuth: true,
    response: { 200: successSchema(), 403: errorSchema, 404: errorSchema },
    detail: { summary: 'Update a product image (Admin or owning seller)' }
  }, async ({ params, body, user }) => {
    const image = await productService.updateImage(user as any, params.imageId, body);
    return successResponse(image, 'Product image updated successfully');
  })

  .delete('/images/:imageId', {
    params: t.Object({ imageId: uuid }),
    isAuth: true,
    response: { 200: successSchema(t.Null()), 403: errorSchema, 404: errorSchema },
    detail: { summary: 'Delete a product image (Admin or owning seller)' }
  }, async ({ params, user }) => {
    await productService.deleteImage(user as any, params.imageId);
    return successResponse(null, 'Product image deleted successfully');
  })

  .get('/:id/variants', {
    params: idParams,
    response: { 200: successSchema() },
    detail: { summary: 'Get product variants' }
  }, async ({ params }) => {
    const variants = await productService.getVariants(params.id);
    return successResponse(variants, 'Product variants retrieved successfully');
  })

  .post('/:id/variants', {
    params: idParams,
    body: variantBody,
    isAuth: true,
    response: { 200: successSchema(), 403: errorSchema, 404: errorSchema, 409: errorSchema },
    detail: { summary: 'Create a product variant (Admin or owning seller)' }
  }, async ({ params, body, user }) => {
    const variant = await productService.createVariant(user as any, params.id, body);
    return successResponse(variant, 'Product variant created successfully');
  })

  .put('/variants/:variantId', {
    params: t.Object({ variantId: uuid }),
    body: t.Partial(variantBody),
    isAuth: true,
    response: { 200: successSchema(), 403: errorSchema, 404: errorSchema, 409: errorSchema },
    detail: { summary: 'Update a product variant (Admin or owning seller)' }
  }, async ({ params, body, user }) => {
    const variant = await productService.updateVariant(user as any, params.variantId, body);
    return successResponse(variant, 'Product variant updated successfully');
  })

  .delete('/variants/:variantId', {
    params: t.Object({ variantId: uuid }),
    isAuth: true,
    response: { 200: successSchema(t.Null()), 403: errorSchema, 404: errorSchema },
    detail: { summary: 'Delete a product variant (Admin or owning seller)' }
  }, async ({ params, user }) => {
    await productService.deleteVariant(user as any, params.variantId);
    return successResponse(null, 'Product variant deleted successfully');
  })

  .put('/:id', {
    params: idParams,
    body: t.Object({
      name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
      description: t.Optional(t.String({ maxLength: 5000 })),
      price: t.Optional(t.Number({ minimum: 0 })),
      imageUrl: t.Optional(t.String({ format: 'uri', maxLength: 500 })),
      stockQuantity: t.Optional(t.Integer({ minimum: 0 })),
      weightGrams: t.Optional(t.Integer({ minimum: 0 })),
      sku: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
      isActive: t.Optional(t.Boolean()),
      categoryId: t.Optional(uuid),
      sellerId: t.Optional(uuid),
    }),
    hasRole: UserRole.ADMIN,
    response: {
      200: successSchema(),
      400: errorSchema,
      404: errorSchema,
      422: errorSchema
    },
    detail: { summary: 'Update product by ID (Admin only)' }
  }, async ({ params, body }) => {
    const updatedProduct = await productService.updateProduct(params.id, body as any);
    return successResponse(updatedProduct, 'Product updated successfully');
  })

  .delete('/:id', {
    params: idParams,
    hasRole: UserRole.ADMIN,
    response: {
      200: successSchema(t.Null()),
      404: errorSchema
    },
    detail: { summary: 'Delete product by ID (Admin only)' }
  }, async ({ params }) => {
    await productService.deleteProduct(params.id);
    return successResponse(null, 'Product deleted successfully');
  });

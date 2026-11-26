import { Elysia, t } from 'elysia';
import { ProductService } from '../service/ProductService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
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
  .post(
    '/',
    async ({ body, set }) => {
      const product = await productService.createProduct(body as any);
      set.status = 201;
      return successResponse(product, 'Product created successfully', 201);
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
        description: t.Optional(t.String({ maxLength: 5000 })),
        price: t.Number({ minimum: 0 }),
        imageUrl: t.Optional(t.String({ format: 'uri', maxLength: 500 })),
        stockQuantity: t.Integer({ minimum: 0 }),
        weightGrams: t.Optional(t.Integer({ minimum: 0 })),
        sku: t.String({ minLength: 1, maxLength: 100 }),
        isActive: t.Optional(t.Boolean()),
        categoryId: t.Optional(t.String({ format: 'uuid' })),
        sellerId: t.String({ format: 'uuid' }),
      }),
      hasRole: UserRole.ADMIN,
      response: {
        201: successSchema(),
        400: errorSchema,
        422: errorSchema
      },
      detail: { summary: 'Create a new product (Admin only)' }
    }
  )

  .get(
    '/',
    async ({ query, user }) => {
      const { page, limit } = getPagination(query);
      const isAdmin = user?.role === UserRole.ADMIN;

      const filters = {
        search: query.search,
        category: query.category,
        sellerId: query.sellerId,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        inStock: query.inStock,
        // Public catalog never exposes inactive products by default.
        isActive: isAdmin ? query.isActive : true,
        sortBy: query.sortBy as any,
        sortOrder: query.sortOrder as any,
      };

      const { items, total } = await productService.getAllProducts(page, limit, filters);

      return paginatedResponse(items, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }, 'Products retrieved successfully');
    },
    {
      query: t.Object({
        search: t.Optional(t.String({ maxLength: 200 })),
        category: t.Optional(t.String({ format: 'uuid' })),
        sellerId: t.Optional(t.String({ format: 'uuid' })),
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
        page: t.Optional(t.Integer({ minimum: 1 })),
        limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
      }),
      response: {
        200: paginatedSchema()
      },
      detail: { summary: 'Get all products with filters' }
    }
  )

  .get(
    '/:id',
    async ({ params, user }) => {
      const isAdmin = user?.role === UserRole.ADMIN;
      const product = await productService.findProductByIdWithDetails(params.id, isAdmin);
      if (!product) throw new NotFoundError('Product not found');
      return successResponse(product, 'Product retrieved successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      response: {
        200: successSchema(),
        404: errorSchema
      },
      detail: { summary: 'Get product by ID' }
    }
  )

  .get(
    '/:id/images',
    async ({ params }) => {
      const images = await productService.getImages(params.id);
      return successResponse(images, 'Product images retrieved successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      response: { 200: successSchema() },
      detail: { summary: 'Get product images' }
    }
  )

  .post(
    '/:id/images',
    async ({ params, body, user }) => {
      const image = await productService.addImage(user as any, params.id, body);
      return successResponse(image, 'Product image added successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: imageBody,
      isAuth: true,
      response: { 200: successSchema(), 403: errorSchema, 404: errorSchema },
      detail: { summary: 'Add a product image (Admin or owning seller)' }
    }
  )

  .put(
    '/images/:imageId',
    async ({ params, body, user }) => {
      const image = await productService.updateImage(user as any, params.imageId, body);
      return successResponse(image, 'Product image updated successfully');
    },
    {
      params: t.Object({ imageId: t.String({ format: 'uuid' }) }),
      body: t.Partial(imageBody),
      isAuth: true,
      response: { 200: successSchema(), 403: errorSchema, 404: errorSchema },
      detail: { summary: 'Update a product image (Admin or owning seller)' }
    }
  )

  .delete(
    '/images/:imageId',
    async ({ params, user }) => {
      await productService.deleteImage(user as any, params.imageId);
      return successResponse(null, 'Product image deleted successfully');
    },
    {
      params: t.Object({ imageId: t.String({ format: 'uuid' }) }),
      isAuth: true,
      response: { 200: successSchema(t.Null()), 403: errorSchema, 404: errorSchema },
      detail: { summary: 'Delete a product image (Admin or owning seller)' }
    }
  )

  .get(
    '/:id/variants',
    async ({ params }) => {
      const variants = await productService.getVariants(params.id);
      return successResponse(variants, 'Product variants retrieved successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      response: { 200: successSchema() },
      detail: { summary: 'Get product variants' }
    }
  )

  .post(
    '/:id/variants',
    async ({ params, body, user }) => {
      const variant = await productService.createVariant(user as any, params.id, body);
      return successResponse(variant, 'Product variant created successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: variantBody,
      isAuth: true,
      response: { 200: successSchema(), 403: errorSchema, 404: errorSchema, 409: errorSchema },
      detail: { summary: 'Create a product variant (Admin or owning seller)' }
    }
  )

  .put(
    '/variants/:variantId',
    async ({ params, body, user }) => {
      const variant = await productService.updateVariant(user as any, params.variantId, body);
      return successResponse(variant, 'Product variant updated successfully');
    },
    {
      params: t.Object({ variantId: t.String({ format: 'uuid' }) }),
      body: t.Partial(variantBody),
      isAuth: true,
      response: { 200: successSchema(), 403: errorSchema, 404: errorSchema, 409: errorSchema },
      detail: { summary: 'Update a product variant (Admin or owning seller)' }
    }
  )

  .delete(
    '/variants/:variantId',
    async ({ params, user }) => {
      await productService.deleteVariant(user as any, params.variantId);
      return successResponse(null, 'Product variant deleted successfully');
    },
    {
      params: t.Object({ variantId: t.String({ format: 'uuid' }) }),
      isAuth: true,
      response: { 200: successSchema(t.Null()), 403: errorSchema, 404: errorSchema },
      detail: { summary: 'Delete a product variant (Admin or owning seller)' }
    }
  )

  .put(
    '/:id',
    async ({ params, body }) => {
      const updatedProduct = await productService.updateProduct(params.id, body as any);
      return successResponse(updatedProduct, 'Product updated successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
        description: t.Optional(t.String({ maxLength: 5000 })),
        price: t.Optional(t.Number({ minimum: 0 })),
        imageUrl: t.Optional(t.String({ format: 'uri', maxLength: 500 })),
        stockQuantity: t.Optional(t.Integer({ minimum: 0 })),
        weightGrams: t.Optional(t.Integer({ minimum: 0 })),
        sku: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
        isActive: t.Optional(t.Boolean()),
        categoryId: t.Optional(t.String({ format: 'uuid' })),
        sellerId: t.Optional(t.String({ format: 'uuid' })),
      }),
      hasRole: UserRole.ADMIN,
      response: {
        200: successSchema(),
        400: errorSchema,
        404: errorSchema,
        422: errorSchema
      },
      detail: { summary: 'Update product by ID (Admin only)' }
    }
  )

  .delete(
    '/:id',
    async ({ params }) => {
      await productService.deleteProduct(params.id);
      return successResponse(null, 'Product deleted successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      hasRole: UserRole.ADMIN,
      response: {
        200: successSchema(t.Null()),
        404: errorSchema
      },
      detail: { summary: 'Delete product by ID (Admin only)' }
    }
  );

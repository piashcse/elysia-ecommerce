import { Elysia, t } from 'elysia';
import { ProductService } from '../service/ProductService';
import { errorResponse, paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';
import { NotFoundError } from '../../../core/errors';

const productService = new ProductService();

export const productController = new Elysia({ prefix: '/products', tags: ['Product'] })
  .use(authPlugin)
  // Create a new product (admin only)
  .post(
    '/',
    async ({ body, set }) => {
      const product = await productService.createProduct(body);
      set.status = 201;
      return successResponse(product, 'Product created successfully', 201);
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        price: t.Number({ minimum: 0 }),
        imageUrl: t.Optional(t.String()),
        stockQuantity: t.Number({ minimum: 0 }),
        sku: t.String({ minLength: 1 }),
        isActive: t.Optional(t.Boolean()),
        categoryId: t.String(),
        sellerId: t.String(),
      }),
      response: {
        201: successSchema(),
        400: errorSchema,
        422: errorSchema
      },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Create a new product (Admin only)' }
    }
  )

  // Get all products with filters and pagination
  .get(
    '/',
    async ({ query }) => {
      const filters = {
        search: query.search,
        category: query.category,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        inStock: query.inStock,
        isActive: query.isActive,
      };

      const { items, total } = await productService.getAllProducts(query.page || 1, query.limit || 10, filters);

      return paginatedResponse(items, {
        page: query.page || 1,
        limit: query.limit || 10,
        total,
        totalPages: Math.ceil(total / (query.limit || 10)),
      }, 'Products retrieved successfully');
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        category: t.Optional(t.String()),
        minPrice: t.Optional(t.Numeric()),
        maxPrice: t.Optional(t.Numeric()),
        inStock: t.Optional(t.Boolean()),
        isActive: t.Optional(t.Boolean()),
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
      }),
      response: {
        200: paginatedSchema()
      },
      detail: { summary: 'Get all products with filters' }
    }
  )

  // Get product by ID
  .get(
    '/:id',
    async ({ params }) => {
      const product = await productService.findProductByIdWithDetails(params.id);
      if (!product) throw new NotFoundError('Product not found');
      return successResponse(product, 'Product retrieved successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: successSchema(),
        404: errorSchema
      },
      detail: { summary: 'Get product by ID' }
    }
  )

  // Update product by ID (admin only)
  .put(
    '/:id',
    async ({ params, body }) => {
      const updatedProduct = await productService.updateProduct(params.id, body);
      return successResponse(updatedProduct, 'Product updated successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        price: t.Optional(t.Number()),
        imageUrl: t.Optional(t.String()),
        stockQuantity: t.Optional(t.Number()),
        sku: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
        categoryId: t.Optional(t.String()),
        sellerId: t.Optional(t.String()),
      }),
      response: {
        200: successSchema(),
        400: errorSchema,
        404: errorSchema,
        422: errorSchema
      },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Update product by ID (Admin only)' }
    }
  )
  // Delete product by ID (admin only)
  .delete(
    '/:id',
    async ({ params }) => {
      await productService.deleteProduct(params.id);
      return successResponse(null, 'Product deleted successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: successSchema(t.Null()),
        404: errorSchema
      },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Delete product by ID (Admin only)' }
    }
  );

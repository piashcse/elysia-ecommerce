import { Elysia, t } from 'elysia';
import { ProductService } from '../service/ProductService';
import { errorResponse, paginatedResponse, successResponse } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';

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
        201: t.Object({
          success: t.Boolean(),
          statusCode: t.Number(),
          message: t.String(),
          data: t.Any()
        }),
        400: t.Any(),
        422: t.Any()
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
        minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
        maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,
        inStock: query.inStock ? query.inStock === 'true' : undefined,
        isActive: query.isActive ? query.isActive === 'true' : undefined,
      };

      const page = query.page ? parseInt(query.page) : 1;
      const limit = query.limit ? parseInt(query.limit) : 10;

      const { products, total } = await productService.getAllProducts(page, limit, filters);

      return paginatedResponse(
        products,
        {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        'Products retrieved successfully'
      );
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        category: t.Optional(t.String()),
        minPrice: t.Optional(t.String()),
        maxPrice: t.Optional(t.String()),
        inStock: t.Optional(t.String()),
        isActive: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          statusCode: t.Number(),
          message: t.String(),
          data: t.Object({
            items: t.Array(t.Any()),
            meta: t.Any()
          })
        })
      },
      detail: { summary: 'Get all products with filters' }
    }
  )

  // Get product by ID
  .get(
    '/:id',
    async ({ params, set }) => {
      const { id } = params;
      // id validation is handled by params schema
      const product = await productService.findProductByIdWithDetails(id);
      if (!product) {
        set.status = 404;
        return errorResponse('Product not found', 'NOT_FOUND', 404);
      }

      return successResponse(product, 'Product retrieved successfully', 200);
    },
    {
      params: t.Object({
        id: t.String() // Could utilize UUID format if strict
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          statusCode: t.Number(),
          message: t.String(),
          data: t.Any()
        }),
        404: t.Any()
      },
      detail: { summary: 'Get product by ID' }
    }
  )

  // Update product by ID (admin only)
  .put(
    '/:id',
    async ({ params, body }) => {
      const { id } = params;

      const updatedProduct = await productService.updateProduct(id, body);

      return successResponse(updatedProduct, 'Product updated successfully', 200);
    },
    {
      params: t.Object({
        id: t.String()
      }),
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
        200: t.Object({
          success: t.Boolean(),
          statusCode: t.Number(),
          message: t.String(),
          data: t.Any()
        }),
        400: t.Any(),
        404: t.Any(),
        422: t.Any()
      },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Update product by ID (Admin only)' }
    }
  )
  // Delete product by ID (admin only)
  .delete(
    '/:id',
    async ({ params }) => {
      const { id } = params;

      await productService.deleteProduct(id);

      return successResponse(null, 'Product deleted successfully', 200);
    },
    {
      params: t.Object({
        id: t.String()
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          statusCode: t.Number(),
          message: t.String(),
          data: t.Null()
        }),
        404: t.Any()
      },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Delete product by ID (Admin only)' }
    }
  );

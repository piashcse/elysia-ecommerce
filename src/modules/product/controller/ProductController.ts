import {Elysia, t} from 'elysia';
import {ProductService} from '../service/ProductService';
import {createProductSchema, productIdSchema, updateProductSchema} from '../validators/ProductValidator';
import {validate} from '../../../utils/validation';
import {errorResponse, paginatedResponse, successResponse} from '../../../core/responses';
import {authPlugin} from '../../../core/auth';

const productService = new ProductService();

export const productController = new Elysia({ prefix: '/products', tags: ['Product'] })
  .use(authPlugin)
  // Create a new product (admin only)
  .post(
    '/',
    async ({ body, set }) => {
      try {
        // Check if user is authenticated and has admin role
        const validatedData = validate(createProductSchema, body);
        const product = await productService.createProduct(validatedData);

        set.status = 201;
        return successResponse(product, 'Product created successfully', 201);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        price: t.Number(),
        imageUrl: t.Optional(t.String()),
        stockQuantity: t.Number(),
        sku: t.String(),
        isActive: t.Optional(t.Boolean()),
        categoryId: t.String(),
        sellerId: t.String(),
      }),
      hasRole: 'admin',
      detail: { summary: 'Create a new product (Admin only)' }
    }
  )

  // Get all products with filters and pagination
  .get(
    '/',
    async ({ query, set }) => {
      try {
        const filters = {
          search: query.search as string | undefined,
          category: query.category as string | undefined,
          minPrice: query.minPrice ? parseFloat(query.minPrice as string) : undefined,
          maxPrice: query.maxPrice ? parseFloat(query.maxPrice as string) : undefined,
          inStock: query.inStock ? query.inStock === 'true' : undefined,
          isActive: query.isActive ? query.isActive === 'true' : undefined,
        };

        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;

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
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
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
      detail: { summary: 'Get all products with filters' }
    }
  )

  // Get product by ID
  .get(
    '/:id',
    async ({ params, set }) => {
      try {
        const { id } = params;
        validate(productIdSchema, { id });

        const product = await productService.findProductByIdWithDetails(id);
        if (!product) {
          set.status = 404;
          return errorResponse('Product not found', 'NOT_FOUND', 404);
        }

        return successResponse(product, 'Product retrieved successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      detail: { summary: 'Get product by ID' }
    }
  )

  // Update product by ID (admin only)
  .put(
    '/:id',
    async ({ params, body, set }) => {
      try {
        const { id } = params;
        validate(productIdSchema, { id });
        const validatedData = validate(updateProductSchema, body);

        const updatedProduct = await productService.updateProduct(id, validatedData);

        return successResponse(updatedProduct, 'Product updated successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
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
      hasRole: 'admin',
      detail: { summary: 'Update product by ID (Admin only)' }
    }
  )
  // Delete product by ID (admin only)
  .delete(
    '/:id',
    async ({ params, set }) => {
      try {
        const { id } = params;
        validate(productIdSchema, { id });

        await productService.deleteProduct(id);

        return successResponse(null, 'Product deleted successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      hasRole: 'admin',
      detail: { summary: 'Delete product by ID (Admin only)' }
    }
  );
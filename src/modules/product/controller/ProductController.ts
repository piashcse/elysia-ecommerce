import { Elysia, t } from 'elysia';
import { ProductService } from '../service/ProductService';
import { 
  createProductSchema, 
  updateProductSchema, 
  productIdSchema,
  productFilterSchema,
  paginationSchema
} from '../validators/ProductValidator';
import { validate } from '../../../utils/validation';
import { successResponse, errorResponse, paginatedResponse } from '../../../core/responses';
import { NotFoundError, UnauthorizedError } from '../../../core/errors';
import { isAuthenticated, hasRole } from '../../../utils/jwt';

const productService = new ProductService();

export const productController = new Elysia({ prefix: '/products', tags: ['Product'] })
  // Create a new product (admin only)
  .post(
    '/',
    async ({ body, set, jwt }) => {
      try {
        // Check if user is authenticated and has admin role
        if (!jwt || jwt.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.');
        }
        
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
        image: t.Optional(t.String()),
        stock: t.Number(),
        isActive: t.Optional(t.Boolean()),
        attributes: t.Optional(t.Record(t.String(), t.Unknown())),
        categoryId: t.String()
      }),
      detail: { tags: ['Product'] }
    }
  )
  
  // Get all products with filters and pagination
  .get(
    '/',
    async ({ query, set }) => {
      try {
        // Parse and validate query parameters
        const validatedQuery = {
          search: query.search as string | undefined,
          category: query.category as string | undefined,
          minPrice: query.minPrice ? parseFloat(query.minPrice as string) : undefined,
          maxPrice: query.maxPrice ? parseFloat(query.maxPrice as string) : undefined,
          inStock: query.inStock ? query.inStock === 'true' : undefined,
          isActive: query.isActive ? query.isActive === 'true' : undefined,
          page: query.page ? parseInt(query.page as string) : 1,
          limit: query.limit ? parseInt(query.limit as string) : 10,
        };
        
        // Apply validation to the filters
        const filters = {
          search: validatedQuery.search,
          category: validatedQuery.category,
          minPrice: validatedQuery.minPrice,
          maxPrice: validatedQuery.maxPrice,
          inStock: validatedQuery.inStock,
          isActive: validatedQuery.isActive,
        };
        
        const page = validatedQuery.page;
        const limit = validatedQuery.limit;
        
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
        inStock: t.Optional(t.BooleanString()),
        isActive: t.Optional(t.BooleanString()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: { tags: ['Product'] }
    }
  )
  
  // Get product by ID
  .get(
    '/:id',
    async ({ params, set }) => {
      try {
        const { id } = params;
        
        // Validate ID format
        validate(productIdSchema, { id });
        
        const product = await productService.findProductByIdWithDetails(id);
        if (!product) {
          set.status = 404;
          return errorResponse('Product not found');
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
      detail: { tags: ['Product'] }
    }
  )

  // Update product by ID (admin only)
  .put(
    '/:id',
    async ({ params, body, set, jwt }) => {
      try {
        // Check if user is authenticated and has admin role
        if (!jwt || jwt.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.');
        }
        
        const { id } = params;
        
        // Validate ID format and body data
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
        image: t.Optional(t.String()),
        stock: t.Optional(t.Number()),
        isActive: t.Optional(t.Boolean()),
        attributes: t.Optional(t.Record(t.String(), t.Unknown())),
        categoryId: t.Optional(t.String())
      }),
      detail: { tags: ['Product'] }
    }
  )

  // Delete product by ID (admin only)
  .delete(
    '/:id',
    async ({ params, set, jwt }) => {
      try {
        // Check if user is authenticated and has admin role
        if (!jwt || jwt.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.');
        }
        
        const { id } = params;
        
        // Validate ID format
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
      detail: { tags: ['Product'] }
    }
  )

  // Get products by category
  .get(
    '/category/:categoryId',
    async ({ params, query, set }) => {
      try {
        const { categoryId } = params;
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;
        
        const { products, total } = await productService.getProductsByCategory(
          categoryId,
          page,
          limit
        );
        
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
      params: t.Object({
        categoryId: t.String()
      }),
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: { tags: ['Product'] }
    }
  );
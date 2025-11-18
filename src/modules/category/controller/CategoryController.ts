import { Elysia, t } from 'elysia';
import { CategoryService } from '../service/CategoryService';
import { 
  createCategorySchema, 
  updateCategorySchema, 
  categoryIdSchema,
  categoryFilterSchema
} from '../validators/CategoryValidator';
import { validate } from '../../../utils/validation';
import { successResponse, errorResponse, paginatedResponse } from '../../../core/responses';
import { NotFoundError, UnauthorizedError, ConflictError } from '../../../core/errors';
import { isAuthenticated, hasRole } from '../../../utils/jwt';

const categoryService = new CategoryService();

export const categoryController = new Elysia({ prefix: '/categories' })
  // Create a new category (admin only)
  .post(
    '/',
    async ({ body, set, jwt }) => {
      try {
        // Check if user is authenticated and has admin role
        if (!jwt || jwt.role !== 'admin') {
          set.status = 403;
          return errorResponse('Access denied. Admin role required.');
        }
        
        const validatedData = validate(createCategorySchema, body);
        const category = await categoryService.createCategory(validatedData);
        
        set.status = 201;
        return successResponse(category, 'Category created successfully', 201);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        image: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      })
    }
  )
  
  // Get all categories with filters and pagination
  .get(
    '/',
    async ({ query, set }) => {
      try {
        // Parse and validate query parameters
        const validatedQuery = {
          search: query.search as string | undefined,
          isActive: query.isActive ? query.isActive === 'true' : undefined,
          page: query.page ? parseInt(query.page as string) : 1,
          limit: query.limit ? parseInt(query.limit as string) : 10,
        };
        
        const page = validatedQuery.page;
        const limit = validatedQuery.limit;
        
        const filters = {
          search: validatedQuery.search,
          isActive: validatedQuery.isActive,
        };
        
        const { categories, total } = await categoryService.getAllCategories(page, limit, filters);
        
        return paginatedResponse(
          categories,
          {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          'Categories retrieved successfully'
        );
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        isActive: t.Optional(t.BooleanString()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      })
    }
  )
  
  // Get category by ID
  .get(
    '/:id',
    async ({ params, set }) => {
      try {
        const { id } = params;
        
        // Validate ID format
        validate(categoryIdSchema, { id });
        
        const category = await categoryService.findCategoryById(id);
        if (!category) {
          set.status = 404;
          return errorResponse('Category not found');
        }
        
        return successResponse(category, 'Category retrieved successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      })
    }
  )
  
  // Get category with its products
  .get(
    '/:id/products',
    async ({ params, query, set }) => {
      try {
        const { id } = params;
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;
        
        // Validate ID format
        validate(categoryIdSchema, { id });
        
        const result = await categoryService.getCategoryWithProducts(id, page, limit);
        
        return successResponse(result, 'Category with products retrieved successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      })
    }
  )
  
  // Update category by ID (admin only)
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
        validate(categoryIdSchema, { id });
        const validatedData = validate(updateCategorySchema, body);
        
        const updatedCategory = await categoryService.updateCategory(id, validatedData);
        
        return successResponse(updatedCategory, 'Category updated successfully', 200);
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
        image: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      })
    }
  )
  
  // Delete category by ID (admin only)
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
        validate(categoryIdSchema, { id });
        
        await categoryService.deleteCategory(id);
        
        return successResponse(null, 'Category deleted successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      })
    }
  );
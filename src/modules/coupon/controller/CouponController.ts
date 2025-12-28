import { Elysia, t } from 'elysia';
import { CouponService } from '../service/CouponService';
import { couponIdSchema, createCouponSchema, updateCouponSchema, } from '../validators/CouponValidator';
import { validate } from '../../../utils/validation';
import { errorResponse, paginatedResponse, successResponse } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';

const couponService = new CouponService();

export const couponController = new Elysia({ prefix: '/coupons', tags: ['Coupon'] })
  .use(authPlugin)
  // Create a new coupon (admin only)
  .post(
    '/',
    async ({ body, set }) => {
      try {
        const validatedData = validate(createCouponSchema, body);
        const coupon = await couponService.createCoupon(validatedData);

        set.status = 201;
        return successResponse(coupon, 'Coupon created successfully', 201);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      body: t.Object({
        code: t.String(),
        description: t.Optional(t.String()),
        discountType: t.Enum({ percentage: 'percentage', fixed: 'fixed' }),
        discountValue: t.Number(),
        minOrderAmount: t.Optional(t.Number()),
        maxDiscountAmount: t.Optional(t.Number()),
        usageLimit: t.Optional(t.Number()),
        isActive: t.Optional(t.Boolean()),
        startDate: t.String(),
        endDate: t.String(),
      }),
      hasRole: 'admin',
      detail: { summary: 'Create a new coupon (Admin only)' }
    }
  )

  // Get all coupons
  .get(
    '/',
    async ({ query, set }) => {
      try {
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;

        const { coupons, total } = await couponService.getAllCoupons(page, limit);

        return paginatedResponse(
          coupons,
          {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          'Coupons retrieved successfully'
        );
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: { summary: 'Get all coupons' }
    }
  )

  // Get coupon by ID
  .get(
    '/:id',
    async ({ params, set }) => {
      try {
        const { id } = params;
        validate(couponIdSchema, { id });

        const coupon = await couponService.findCouponById(id);
        if (!coupon) {
          set.status = 404;
          return errorResponse('Coupon not found', 'NOT_FOUND', 404);
        }

        return successResponse(coupon, 'Coupon retrieved successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String()
      }),
      detail: { summary: 'Get coupon by ID' }
    }
  )

  // Get coupon by code
  .get(
    '/code/:code',
    async ({ params, set }) => {
      try {
        const { code } = params;

        const coupon = await couponService.getCouponByCode(code);
        if (!coupon) {
          set.status = 404;
          return errorResponse('Coupon not found', 'NOT_FOUND', 404);
        }

        return successResponse(coupon, 'Coupon retrieved successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        code: t.String()
      }),
      detail: { summary: 'Get coupon by code' }
    }
  )

  // Update coupon by ID (admin only)
  .put(
    '/:id',
    async ({ params, body, set }) => {
      try {
        const { id } = params;
        validate(couponIdSchema, { id });
        const validatedData = validate(updateCouponSchema, body);

        const updatedCoupon = await couponService.updateCoupon(id, validatedData);

        return successResponse(updatedCoupon, 'Coupon updated successfully', 200);
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
        code: t.Optional(t.String()),
        description: t.Optional(t.String()),
        discountType: t.Optional(t.Enum({ percentage: 'percentage', fixed: 'fixed' })),
        discountValue: t.Optional(t.Number()),
        minOrderAmount: t.Optional(t.Number()),
        maxDiscountAmount: t.Optional(t.Number()),
        usageLimit: t.Optional(t.Number()),
        isActive: t.Optional(t.Boolean()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
      hasRole: 'admin',
      detail: { summary: 'Update coupon by ID (Admin only)' }
    }
  )

  // Delete coupon by ID (admin only)
  .delete(
    '/:id',
    async ({ params, set }) => {
      try {
        const { id } = params;
        validate(couponIdSchema, { id });

        await couponService.deleteCoupon(id);

        return successResponse(null, 'Coupon deleted successfully', 200);
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
      detail: { summary: 'Delete coupon by ID (Admin only)' }
    }
  );

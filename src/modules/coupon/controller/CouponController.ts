import { Elysia, t } from 'elysia';
import { CouponService } from '../service/CouponService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';
import { NotFoundError } from '../../../core/errors';
import { PAGINATION } from '../../../core/constants';
import { getPagination } from '../../../utils/validation';

const couponService = new CouponService();

export const couponController = new Elysia({ prefix: '/coupons', tags: ['Coupon'] })
  .use(authPlugin)
  .post(
    '/',
    async ({ body, set }) => {
      const coupon = await couponService.createCoupon({
        ...body,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
      } as any);
      set.status = 201;
      return successResponse(coupon, 'Coupon created successfully', 201);
    },
    {
      body: t.Object({
        code: t.String({ minLength: 1, maxLength: 50 }),
        description: t.Optional(t.String({ maxLength: 1000 })),
        discountType: t.Union([t.Literal('percentage'), t.Literal('fixed')]),
        discountValue: t.Number({ minimum: 0.01 }),
        minOrderAmount: t.Optional(t.Number({ minimum: 0 })),
        maxDiscountAmount: t.Optional(t.Number({ minimum: 0 })),
        startDate: t.String({ format: 'date-time' }),
        endDate: t.String({ format: 'date-time' }),
        usageLimit: t.Optional(t.Integer({ minimum: 1 })),
        perUserLimit: t.Optional(t.Integer({ minimum: 1 })),
        isActive: t.Optional(t.Boolean())
      }),
      hasRole: UserRole.ADMIN,
      response: {
        201: successSchema(),
        400: errorSchema,
        409: errorSchema,
        422: errorSchema
      },
      detail: { summary: 'Create a new coupon (Admin only)' }
    }
  )

  .get(
    '/',
    async ({ query }) => {
      const { page, limit } = getPagination(query);
      const { items, total } = await couponService.getCoupons(page, limit, {
        code: query.code,
        isActive: query.isActive,
      });

      return paginatedResponse(items, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }, 'Coupons retrieved successfully');
    },
    {
      query: t.Object({
        page: t.Optional(t.Integer({ minimum: 1 })),
        limit: t.Optional(t.Integer({ minimum: 1, maximum: PAGINATION.MAX_LIMIT })),
        code: t.Optional(t.String({ maxLength: 50 })),
        isActive: t.Optional(t.Boolean()),
      }),
      hasRole: UserRole.ADMIN,
      response: {
        200: paginatedSchema()
      },
      detail: { summary: 'Get all coupons (Admin only)' }
    }
  )

  // Validate/apply a coupon before checkout
  .post(
    '/validate',
    async ({ body, user }) => {
      const validation = await couponService.validateCoupon(body.code, body.orderAmount, user!.sub);
      return successResponse(
        {
          valid: true,
          code: validation.coupon.code,
          discountType: validation.coupon.discountType,
          discountValue: validation.coupon.discountValue,
          discountAmount: validation.discountAmount,
        },
        'Coupon applied successfully'
      );
    },
    {
      body: t.Object({
        code: t.String({ minLength: 1, maxLength: 50 }),
        orderAmount: t.Number({ minimum: 0.01 }),
      }),
      isAuth: true,
      response: { 200: successSchema(), 422: errorSchema },
      detail: { summary: 'Validate a coupon against an order amount' }
    }
  )

  .get(
    '/code/:code',
    async ({ params }) => {
      const coupon = await couponService.getCouponByCode(params.code);
      if (!coupon) throw new NotFoundError('Coupon not found');
      return successResponse(coupon, 'Coupon retrieved successfully');
    },
    {
      params: t.Object({ code: t.String({ maxLength: 50 }) }),
      isAuth: true,
      response: {
        200: successSchema(),
        404: errorSchema
      },
      detail: { summary: 'Get coupon by code' }
    }
  )

  .get(
    '/:id',
    async ({ params }) => {
      const coupon = await couponService.getCouponById(params.id);
      return successResponse(coupon, 'Coupon retrieved successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      hasRole: UserRole.ADMIN,
      response: { 200: successSchema(), 404: errorSchema },
      detail: { summary: 'Get coupon by ID (Admin only)' }
    }
  )

  .put(
    '/:id',
    async ({ params, body }) => {
      const updateData = { ...body };
      if (body.startDate) (updateData as any).startDate = new Date(body.startDate);
      if (body.endDate) (updateData as any).endDate = new Date(body.endDate);

      const updatedCoupon = await couponService.updateCoupon(params.id, updateData as any);
      return successResponse(updatedCoupon, 'Coupon updated successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({
        code: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
        description: t.Optional(t.String({ maxLength: 1000 })),
        discountType: t.Optional(t.Union([t.Literal('percentage'), t.Literal('fixed')])),
        discountValue: t.Optional(t.Number({ minimum: 0.01 })),
        minOrderAmount: t.Optional(t.Number({ minimum: 0 })),
        maxDiscountAmount: t.Optional(t.Number({ minimum: 0 })),
        startDate: t.Optional(t.String({ format: 'date-time' })),
        endDate: t.Optional(t.String({ format: 'date-time' })),
        usageLimit: t.Optional(t.Integer({ minimum: 1 })),
        perUserLimit: t.Optional(t.Integer({ minimum: 1 })),
        isActive: t.Optional(t.Boolean())
      }),
      hasRole: UserRole.ADMIN,
      response: {
        200: successSchema(),
        400: errorSchema,
        404: errorSchema,
        409: errorSchema
      },
      detail: { summary: 'Update coupon by ID (Admin only)' }
    }
  )

  .delete(
    '/:id',
    async ({ params }) => {
      await couponService.delete(params.id);
      return successResponse(null, 'Coupon deleted successfully');
    },
    {
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      hasRole: UserRole.ADMIN,
      response: {
        200: successSchema(t.Null()),
        404: errorSchema
      },
      detail: { summary: 'Delete coupon by ID (Admin only)' }
    }
  );

import { Elysia, t } from 'elysia';
import { CouponService } from '../service/CouponService';
import { paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';

const couponService = new CouponService();

export const couponController = new Elysia({ prefix: '/coupons', tags: ['Coupon'] })
  .use(authPlugin)
  // Create a new coupon (admin only)
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
        code: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        discountType: t.Union([t.Literal('percentage'), t.Literal('fixed')]),
        discountValue: t.Number({ minimum: 0 }),
        minOrderAmount: t.Optional(t.Number({ minimum: 0 })),
        maxDiscountAmount: t.Optional(t.Number({ minimum: 0 })),
        startDate: t.String(),
        endDate: t.String(),
        usageLimit: t.Optional(t.Number({ minimum: 1 })),
        isActive: t.Optional(t.Boolean())
      }),
      response: {
        201: successSchema(),
        400: errorSchema,
        422: errorSchema
      },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Create a new coupon (Admin only)' }
    }
  )

  // Get all coupons (admin only)
  .get(
    '/',
    async ({ query }) => {
      const page = query.page || 1;
      const limit = query.limit || 10;
      const { items, total } = await couponService.findAll(page, limit);

      return paginatedResponse(items, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }, 'Coupons retrieved successfully');
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
      }),
      hasRole: UserRole.ADMIN,
      response: {
        200: paginatedSchema()
      },
      detail: { summary: 'Get all coupons (Admin only)' }
    }
  )

  // Get coupon by code
  .get(
    '/code/:code',
    async ({ params }) => {
      const coupon = await couponService.getCouponByCode(params.code);
      if (!coupon) {
        return successResponse(null, 'Coupon not found', 404);
      }
      return successResponse(coupon, 'Coupon retrieved successfully');
    },
    {
      params: t.Object({ code: t.String() }),
      response: {
        200: successSchema(),
        404: successSchema(t.Null())
      },
      detail: { summary: 'Get coupon by code' }
    }
  )

  // Update coupon by ID (admin only)
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
      params: t.Object({ id: t.String() }),
      body: t.Object({
        code: t.Optional(t.String()),
        description: t.Optional(t.String()),
        discountType: t.Optional(t.Union([t.Literal('percentage'), t.Literal('fixed')])),
        discountValue: t.Optional(t.Number()),
        minOrderAmount: t.Optional(t.Number()),
        maxDiscountAmount: t.Optional(t.Number()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        usageLimit: t.Optional(t.Number()),
        isActive: t.Optional(t.Boolean())
      }),
      response: {
        200: successSchema(),
        400: errorSchema,
        404: errorSchema
      },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Update coupon by ID (Admin only)' }
    }
  )

  // Delete coupon by ID (admin only)
  .delete(
    '/:id',
    async ({ params }) => {
      await couponService.delete(params.id);
      return successResponse(null, 'Coupon deleted successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: successSchema(t.Null()),
        404: errorSchema
      },
      hasRole: UserRole.ADMIN,
      detail: { summary: 'Delete coupon by ID (Admin only)' }
    }
  );

import {Elysia, t} from 'elysia';
import {NotificationService} from '../service/NotificationService';
import {notificationIdSchema,} from '../validators/NotificationValidator';
import {validate} from '../../../utils/validation';
import {errorResponse, paginatedResponse, successResponse} from '../../../core/responses';
import {authPlugin} from '../../../core/auth';

const notificationService = new NotificationService();

export const notificationController = new Elysia({ prefix: '/notifications', tags: ['Notification'] })
  .use(authPlugin)
  .guard({
    isAuth: true
  })
  // Get all notifications for the authenticated user
  .get(
    '/',
    async ({ query, set, user }) => {
      try {
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 10;
        const { notifications, total } = await notificationService.getUserNotifications(user!.sub, page, limit);

        return paginatedResponse(
          notifications,
          {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          'Notifications retrieved successfully'
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
      detail: { summary: "Get all notifications for the authenticated user" },
    }
  )
  // Mark a notification as read
  .patch(
    '/:id/read',
    async ({ params, set, user }) => {
      try {
        const { id } = params;
        validate(notificationIdSchema, { id });

        const updatedNotification = await notificationService.markAsRead(id, user!.sub);

        return successResponse(updatedNotification, 'Notification marked as read', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: { summary: "Mark a notification as read" },
    }
  )
  // Mark all notifications as read
  .patch(
    '/read/all',
    async ({ set, user }) => {
      try {
        await notificationService.markAllAsRead(user!.sub);
        return successResponse(null, 'All notifications marked as read', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      detail: { summary: "Mark all notifications as read" },
    }
  )
  // Delete a notification
  .delete(
    '/:id',
    async ({ params, set, user }) => {
      try {
        const { id } = params;
        validate(notificationIdSchema, { id });

        await notificationService.deleteNotification(id, user!.sub);

        return successResponse(null, 'Notification deleted successfully', 200);
      } catch (error: any) {
        set.status = error.statusCode || 500;
        return errorResponse(error.message, error.errorCode || 'INTERNAL_ERROR', error.statusCode || 500);
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: { summary: "Delete a notification" },
    }
  );

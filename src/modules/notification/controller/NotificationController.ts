import { Elysia, t } from 'elysia';
import { NotificationService } from '../service/NotificationService';
import { errorResponse, paginatedResponse, successResponse, successSchema, paginatedSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';

const notificationService = new NotificationService();

export const notificationController = new Elysia({ prefix: '/notifications', tags: ['Notification'] })
  .use(authPlugin)
  .guard({
    isAuth: true
  })

  // Get all notifications for the authenticated user
  .get(
    '/',
    async ({ query, user }) => {
      const page = query.page || 1;
      const limit = query.limit || 10;
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
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
      }),
      response: { 200: paginatedSchema() },
      detail: { summary: "Get all notifications for the authenticated user" },
    }
  )

  // Mark a notification as read
  .patch(
    '/:id/read',
    async ({ params, user }) => {
      const updatedNotification = await notificationService.markAsRead(params.id, user!.sub);
      return successResponse(updatedNotification, 'Notification marked as read');
    },
    {
      params: t.Object({ id: t.String() }),
      response: { 200: successSchema(), 404: errorSchema },
      detail: { summary: "Mark a notification as read" },
    }
  )

  // Mark all notifications as read
  .patch(
    '/read/all',
    async ({ user }) => {
      await notificationService.markAllAsRead(user!.sub);
      return successResponse(null, 'All notifications marked as read');
    },
    {
      response: { 200: successSchema(t.Null()) },
      detail: { summary: "Mark all notifications as read" },
    }
  )

  // Delete a notification
  .delete(
    '/:id',
    async ({ params, user }) => {
      await notificationService.deleteNotification(params.id, user!.sub);
      return successResponse(null, 'Notification deleted successfully');
    },
    {
      params: t.Object({ id: t.String() }),
      response: { 200: successSchema(t.Null()), 404: errorSchema },
      detail: { summary: "Delete a notification" },
    }
  );

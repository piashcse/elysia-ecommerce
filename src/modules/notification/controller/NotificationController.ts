import { Elysia, t } from 'elysia';
import { NotificationService } from '../service/NotificationService';
import { errorResponse, paginatedResponse, successResponse } from '../../../core/responses';
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
      const page = query.page ? parseInt(query.page) : 1;
      const limit = query.limit ? parseInt(query.limit) : 10;
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
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      response: { 200: t.Any() },
      detail: { summary: "Get all notifications for the authenticated user" },
    }
  )
  // Mark a notification as read
  .patch(
    '/:id/read',
    async ({ params, user }) => {
      const { id } = params;

      const updatedNotification = await notificationService.markAsRead(id, user!.sub);

      return successResponse(updatedNotification, 'Notification marked as read', 200);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: { 200: t.Any(), 404: t.Any() },
      detail: { summary: "Mark a notification as read" },
    }
  )
  // Mark all notifications as read
  .patch(
    '/read/all',
    async ({ user }) => {
      await notificationService.markAllAsRead(user!.sub);
      return successResponse(null, 'All notifications marked as read', 200);
    },
    {
      response: { 200: t.Any() },
      detail: { summary: "Mark all notifications as read" },
    }
  )
  // Delete a notification
  .delete(
    '/:id',
    async ({ params, user }) => {
      const { id } = params;

      await notificationService.deleteNotification(id, user!.sub);

      return successResponse(null, 'Notification deleted successfully', 200);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: { 200: t.Any(), 404: t.Any() },
      detail: { summary: "Delete a notification" },
    }
  );

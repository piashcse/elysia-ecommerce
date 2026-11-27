import { Elysia, t } from 'elysia';
import { NotificationPreferenceService } from '../service/NotificationPreferenceService';
import { successResponse, successSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { NotificationType } from '../dto/NotificationDto';

const service = new NotificationPreferenceService();

const notificationType = t.String({ minLength: 1, maxLength: 50 });

export const notificationPreferenceController = new Elysia({ prefix: '/notifications', tags: ['Notification'] })
  .use(authPlugin)
  .guard({ isAuth: true })
  .get('/preferences', {
    response: { 200: successSchema() },
    detail: { summary: 'Get notification preferences' }
  }, async ({ user }) => successResponse(await service.list(user!.sub), 'Notification preferences retrieved successfully'))
  .put('/preferences', {
    body: t.Object({
      preferences: t.Array(t.Object({
        type: notificationType,
        inAppEnabled: t.Optional(t.Boolean()),
        emailEnabled: t.Optional(t.Boolean()),
      }), { minItems: 1, maxItems: 50 }),
    }),
    response: { 200: successSchema() },
    detail: { summary: 'Update notification preferences' }
  }, async ({ user, body }) => {
    const preferences = await service.update(
      user!.sub,
      body.preferences as Array<{ type: NotificationType; inAppEnabled?: boolean; emailEnabled?: boolean }>
    );
    return successResponse(preferences, 'Notification preferences updated successfully');
  });

import { Elysia, t } from 'elysia';
import { InvoiceService } from '../service/InvoiceService';
import { authPlugin } from '../../../core/auth';
import { idParams } from '../../../core/schemas';
import { ForbiddenError, NotFoundError } from '../../../core/errors';
import { canAccessOrder } from '../order-access';

const invoices = new InvoiceService();

export const invoiceController = new Elysia({ prefix: '/orders', tags: ['Order'] })
  .use(authPlugin)
  .get('/:id/invoice', {
    params: idParams,
    query: t.Object({ guestToken: t.Optional(t.String({ maxLength: 128 })) }),
    detail: { summary: 'Download an order invoice (HTML)' }
  }, async ({ params, query, user }) => {
    const invoice = await invoices.render(params.id);
    if (!invoice) throw new NotFoundError('Order not found');
    if (!canAccessOrder(invoice.order, user, query.guestToken)) {
      throw new ForbiddenError('You can only access your own invoices');
    }

    return new Response(invoice.html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="invoice-${invoice.order.orderNumber ?? invoice.order.id}.html"`,
      },
    });
  });

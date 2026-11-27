const money = (value: unknown) => Number(value ?? 0).toFixed(2);

export const emailTemplates = {
  orderConfirmation: (order: any) => ({
    subject: `Order ${order.orderNumber} confirmed`,
    text: `Thanks for your order. Your order ${order.orderNumber} has been received. Total: ${money(order.totalAmount)}.`,
    html: `<p>Thanks for your order.</p><p>Order <strong>${order.orderNumber}</strong> has been received.</p><p>Total: ${money(order.totalAmount)}</p>`,
  }),
  orderStatus: (order: any, status: string) => ({
    subject: `Order ${order.orderNumber} ${status}`,
    text: `Your order ${order.orderNumber} is now ${status}.`,
    html: `<p>Your order <strong>${order.orderNumber}</strong> is now <strong>${status}</strong>.</p>`,
  }),
  paymentCompleted: (order: any) => ({
    subject: `Payment received for ${order.orderNumber}`,
    text: `We received your payment for order ${order.orderNumber}.`,
    html: `<p>We received your payment for order <strong>${order.orderNumber}</strong>.</p>`,
  }),
  paymentFailed: (order: any) => ({
    subject: `Payment failed for ${order.orderNumber}`,
    text: `Your payment for order ${order.orderNumber} could not be completed.`,
    html: `<p>Your payment for order <strong>${order.orderNumber}</strong> could not be completed.</p>`,
  }),
  refunded: (order: any, amount?: string | number) => ({
    subject: `Refund processed for ${order.orderNumber}`,
    text: `A refund${amount ? ` of ${money(amount)}` : ''} for order ${order.orderNumber} has been processed.`,
    html: `<p>A refund${amount ? ` of <strong>${money(amount)}</strong>` : ''} for order <strong>${order.orderNumber}</strong> has been processed.</p>`,
  }),
};

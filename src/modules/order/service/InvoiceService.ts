import { OrderService } from '../service/OrderService';

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export class InvoiceService {
  private orders = new OrderService();

  async render(orderId: string): Promise<{ order: any; html: string } | null> {
    const order = await this.orders.getOrderById(orderId);
    if (!order) return null;

    const rows = order.items
      .map((item: any) => `
        <tr>
          <td>${escapeHtml(item.productName)}${item.variantName ? ` — ${escapeHtml(item.variantName)}` : ''}</td>
          <td>${escapeHtml(item.productSku)}</td>
          <td class="num">${item.quantity}</td>
          <td class="num">${item.price}</td>
          <td class="num">${(Number(item.price) * item.quantity).toFixed(2)}</td>
        </tr>`)
      .join('');

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Invoice ${escapeHtml(order.orderNumber ?? order.id)}</title>
<style>
body{font:14px/1.5 system-ui,sans-serif;color:#111;max-width:820px;margin:32px auto;padding:0 20px}
h1{margin:0 0 4px} .muted{color:#666} table{width:100%;border-collapse:collapse;margin:24px 0}
th,td{padding:8px;border-bottom:1px solid #ddd;text-align:left} .num{text-align:right}
.totals{margin-left:auto;width:300px} .totals td{border:0;padding:4px 8px} .totals .total{font-weight:700;border-top:1px solid #111}
</style></head><body>
<h1>Invoice</h1>
<div class="muted">Order ${escapeHtml(order.orderNumber ?? order.id)} · ${new Date(order.createdAt).toLocaleString()}</div>
<p><strong>Bill to:</strong> ${escapeHtml(order.customerEmail ?? order.user?.email ?? '')}<br>
${escapeHtml(order.billingAddress?.address ?? '')}, ${escapeHtml(order.billingAddress?.city ?? '')}, ${escapeHtml(order.billingAddress?.country ?? '')}</p>
<table><thead><tr><th>Item</th><th>SKU</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Total</th></tr></thead>
<tbody>${rows}</tbody></table>
<table class="totals">
<tr><td>Subtotal</td><td class="num">${order.subtotal}</td></tr>
<tr><td>Discount</td><td class="num">-${order.discountAmount}</td></tr>
<tr><td>Shipping</td><td class="num">${order.shippingCost}</td></tr>
<tr><td>Tax (${(Number(order.taxRate) * 100).toFixed(2)}%)</td><td class="num">${order.taxAmount}</td></tr>
<tr class="total"><td>Total</td><td class="num">${order.totalAmount}</td></tr>
</table>
<p class="muted">Status: ${escapeHtml(order.status)}</p>
</body></html>`;

    return { order, html };
  }
}

import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../../config/database';
import { orderItems, orders, products } from '../../../database/schema';
import { OrderEventService } from '../../order/service/OrderEventService';
import { NotFoundError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';
import { PAGINATION } from '../../../core/constants';
import { ProductService } from '../../product/service/ProductService';
import { PayoutService } from './PayoutService';

export class SellerService extends BaseService {
    private productService = new ProductService();
    private events = new OrderEventService();
    private payouts = new PayoutService();

    constructor() {
        super(products);
    }

    async getSellerProducts(sellerId: string, page: number = 1, limit: number = PAGINATION.DEFAULT_LIMIT) {
        return this.findAll(page, limit, [eq(products.sellerId, sellerId)]);
    }

    async createSellerProduct(sellerId: string, data: any) {
        return this.productService.createProduct({
            ...data,
            sellerId,
        });
    }

    async updateSellerProduct(sellerId: string, productId: string, data: any) {
        const [product] = await db
            .select({ id: products.id })
            .from(products)
            .where(and(eq(products.id, productId), eq(products.sellerId, sellerId)))
            .limit(1);

        if (!product) {
            throw new NotFoundError('Product not found or you do not have permission to update it');
        }

        return this.productService.updateProduct(productId, data);
    }

    async deleteSellerProduct(sellerId: string, productId: string) {
        const [product] = await db
            .select({ id: products.id })
            .from(products)
            .where(and(eq(products.id, productId), eq(products.sellerId, sellerId)))
            .limit(1);

        if (!product) {
            throw new NotFoundError('Product not found or you do not have permission to delete it');
        }

        return this.productService.deleteProduct(productId);
    }

    async getSellerOrders(sellerId: string, page: number = 1, limit: number = PAGINATION.DEFAULT_LIMIT) {
        const safePage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
        const safeLimit = Number.isFinite(limit) ? Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Math.trunc(limit))) : PAGINATION.DEFAULT_LIMIT;
        const offset = (safePage - 1) * safeLimit;

        const [sellerOrders, [countResult]] = await Promise.all([
            db
                .select({
                    orderId: orders.id,
                    status: orders.status,
                    totalAmount: orders.totalAmount,
                    createdAt: orders.createdAt,
                    sellerSubtotal: sql<string>`coalesce(sum(${orderItems.price} * ${orderItems.quantity}), 0)`,
                    items: sql`json_agg(json_build_object(
                        'id', ${orderItems.id},
                        'productId', ${orderItems.productId},
                        'productName', ${orderItems.productName},
                        'productSku', ${orderItems.productSku},
                        'quantity', ${orderItems.quantity},
                        'price', ${orderItems.price},
                        'fulfillmentStatus', ${orderItems.fulfillmentStatus}
                    ))`
                })
                .from(orders)
                .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
                .where(eq(orderItems.sellerId, sellerId))
                .groupBy(orders.id)
                .orderBy(desc(orders.createdAt))
                .limit(safeLimit)
                .offset(offset),
            db
                .select({ count: sql<number>`count(distinct ${orders.id})` })
                .from(orders)
                .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
                .where(eq(orderItems.sellerId, sellerId)),
        ]);

        return {
            items: sellerOrders,
            total: countResult ? Number(countResult.count) : 0,
        };
    }

    async updateFulfillment(
        sellerId: string,
        orderId: string,
        itemId: string,
        status: 'pending' | 'shipped' | 'delivered' | 'cancelled'
    ) {
        const [item] = await db.select().from(orderItems).where(and(
            eq(orderItems.id, itemId),
            eq(orderItems.orderId, orderId),
            eq(orderItems.sellerId, sellerId)
        )).limit(1);

        if (!item) throw new NotFoundError('Order item not found');
        const [updated] = await db.update(orderItems)
            .set({ fulfillmentStatus: status })
            .where(eq(orderItems.id, itemId))
            .returning();

        await this.events.add(orderId, 'fulfillment_updated', `Fulfillment status: ${status}`);
        return updated;
    }

    async getSellerPayouts(sellerId: string) {
        return this.payouts.summary(sellerId);
    }

    async getSellerStats(sellerId: string) {
        const [[productStats], [salesStats]] = await Promise.all([
            db
                .select({
                    totalProducts: sql<number>`count(*)`,
                    activeProducts: sql<number>`count(*) filter (where ${products.isActive} = true)`,
                    lowStockProducts: sql<number>`count(*) filter (where ${products.stockQuantity} <= 10)`,
                })
                .from(products)
                .where(eq(products.sellerId, sellerId)),
            db
                .select({
                    itemsSold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`,
                    revenue: sql<string>`coalesce(sum((${orderItems.price} * ${orderItems.quantity}) / ${orders.exchangeRate}), 0)`,
                })
                .from(orderItems)
                .innerJoin(orders, eq(orderItems.orderId, orders.id))
                .where(and(eq(orderItems.sellerId, sellerId), eq(orders.status, 'delivered'))),
        ]);

        return {
            totalProducts: productStats ? Number(productStats.totalProducts) : 0,
            activeProducts: productStats ? Number(productStats.activeProducts) : 0,
            lowStockProducts: productStats ? Number(productStats.lowStockProducts) : 0,
            itemsSold: salesStats ? Number(salesStats.itemsSold) : 0,
            revenue: salesStats ? Number(salesStats.revenue) : 0,
        };
    }
}

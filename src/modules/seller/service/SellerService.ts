import { db } from '../../../config/database';
import { orderItems, orders, products } from '../../../database/schema';
import { and, eq, sql } from 'drizzle-orm';
import { NotFoundError } from '../../../core/errors';
import { BaseService } from '../../../core/base.service';

export class SellerService extends BaseService<typeof products> {
    constructor() {
        super(products);
    }

    async getSellerProducts(sellerId: string, page: number = 1, limit: number = 10) {
        return this.findAll(page, limit, [eq(products.sellerId, sellerId)]);
    }

    async createSellerProduct(sellerId: string, data: any) {
        return this.create({
            ...data,
            sellerId,
        });
    }

    async updateSellerProduct(sellerId: string, productId: string, data: any) {
        const product = await db
            .select()
            .from(products)
            .where(and(eq(products.id, productId), eq(products.sellerId, sellerId)))
            .limit(1);

        if (product.length === 0) {
            throw new NotFoundError('Product not found or you do not have permission to update it');
        }

        return this.update(productId, data);
    }

    async deleteSellerProduct(sellerId: string, productId: string) {
        const product = await db
            .select()
            .from(products)
            .where(and(eq(products.id, productId), eq(products.sellerId, sellerId)))
            .limit(1);

        if (product.length === 0) {
            throw new NotFoundError('Product not found or you do not have permission to delete it');
        }

        return this.delete(productId);
    }

    async getSellerOrders(sellerId: string) {
        const sellerOrders = await db
            .select({
                orderId: orders.id,
                status: orders.status,
                totalAmount: orders.totalAmount,
                createdAt: orders.createdAt,
                items: sql`json_agg(json_build_object('id', ${orderItems.id}, 'productId', ${orderItems.productId}, 'quantity', ${orderItems.quantity}, 'price', ${orderItems.price}))`
            })
            .from(orders)
            .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
            .innerJoin(products, eq(orderItems.productId, products.id))
            .where(eq(products.sellerId, sellerId))
            .groupBy(orders.id);

        return sellerOrders;
    }
}

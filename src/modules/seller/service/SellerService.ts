import {db} from '../../../config/database';
import {orderItems, orders, products} from '../../../database/schema';
import {and, desc, eq, sql} from 'drizzle-orm';
import {NotFoundError} from '../../../core/errors';

export class SellerService {
    async getSellerProducts(sellerId: string, page: number = 1, limit: number = 10) {
        const offset = (page - 1) * limit;

        const sellerProducts = await db
            .select()
            .from(products)
            .where(eq(products.sellerId, sellerId))
            .orderBy(desc(products.createdAt))
            .limit(limit)
            .offset(offset);

        const [countResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(eq(products.sellerId, sellerId));

        return {
            products: sellerProducts,
            total: countResult ? Number(countResult.count) : 0,
        };
    }

    async createProduct(sellerId: string, data: any) {
        const [newProduct] = await db.insert(products).values({
            ...data,
            sellerId,
        }).returning();
        return newProduct;
    }

    async updateProduct(sellerId: string, productId: string, data: any) {
        const [product] = await db
            .select()
            .from(products)
            .where(and(eq(products.id, productId), eq(products.sellerId, sellerId)))
            .limit(1);

        if (!product) {
            throw new NotFoundError('Product not found or you do not have permission to update it');
        }

        const [updatedProduct] = await db
            .update(products)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(products.id, productId))
            .returning();

        return updatedProduct;
    }

    async deleteProduct(sellerId: string, productId: string) {
        const [product] = await db
            .select()
            .from(products)
            .where(and(eq(products.id, productId), eq(products.sellerId, sellerId)))
            .limit(1);

        if (!product) {
            throw new NotFoundError('Product not found or you do not have permission to delete it');
        }

        await db.delete(products).where(eq(products.id, productId));
    }

    async getSellerOrders(sellerId: string) {
        // This is more complex as an order can contain items from multiple sellers
        // We want to find all orders that have at least one item from this seller
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

import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../../../config/database';
import { categoryTranslations, productTranslations } from '../../../database/schema';

export interface TranslationInput {
  name?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
}

const mergeProduct = (product: any, translation: any) => {
  if (!translation) return product;
  return {
    ...product,
    name: translation.name ?? product.name,
    description: translation.description ?? product.description,
    metaTitle: translation.metaTitle ?? product.metaTitle,
    metaDescription: translation.metaDescription ?? product.metaDescription,
    locale: translation.locale,
  };
};

const mergeCategory = (category: any, translation: any) => {
  if (!translation) return category;
  return {
    ...category,
    name: translation.name ?? category.name,
    description: translation.description ?? category.description,
    metaTitle: translation.metaTitle ?? category.metaTitle,
    metaDescription: translation.metaDescription ?? category.metaDescription,
    locale: translation.locale,
  };
};

export class TranslationService {
  async listProductTranslations(productId: string) {
    return db.select().from(productTranslations).where(eq(productTranslations.productId, productId));
  }

  async getProductTranslation(productId: string, locale: string) {
    const [record] = await db
      .select()
      .from(productTranslations)
      .where(and(eq(productTranslations.productId, productId), eq(productTranslations.locale, locale)))
      .limit(1);
    return record ?? null;
  }

  async upsertProductTranslation(productId: string, locale: string, input: TranslationInput) {
    const [record] = await db
      .insert(productTranslations)
      .values({ productId, locale, ...input })
      .onConflictDoUpdate({
        target: [productTranslations.productId, productTranslations.locale],
        set: { ...input, updatedAt: new Date() },
      })
      .returning();
    return record;
  }

  async deleteProductTranslation(productId: string, locale: string) {
    return db
      .delete(productTranslations)
      .where(and(eq(productTranslations.productId, productId), eq(productTranslations.locale, locale)))
      .returning();
  }

  async applyProduct(product: any, locale?: string) {
    if (!locale || !product?.id) return product;
    const translation = await this.getProductTranslation(product.id, locale);
    return mergeProduct(product, translation);
  }

  async applyProducts(items: any[], locale?: string) {
    if (!locale || !items.length) return items;
    const rows = await db
      .select()
      .from(productTranslations)
      .where(and(
        eq(productTranslations.locale, locale),
        inArray(productTranslations.productId, items.map((item) => item.id))
      ));
    const byProduct = new Map(rows.map((row) => [row.productId, row]));
    return items.map((item) => mergeProduct(item, byProduct.get(item.id)));
  }

  async listCategoryTranslations(categoryId: string) {
    return db.select().from(categoryTranslations).where(eq(categoryTranslations.categoryId, categoryId));
  }

  async getCategoryTranslation(categoryId: string, locale: string) {
    const [record] = await db
      .select()
      .from(categoryTranslations)
      .where(and(eq(categoryTranslations.categoryId, categoryId), eq(categoryTranslations.locale, locale)))
      .limit(1);
    return record ?? null;
  }

  async upsertCategoryTranslation(categoryId: string, locale: string, input: TranslationInput) {
    const [record] = await db
      .insert(categoryTranslations)
      .values({ categoryId, locale, ...input })
      .onConflictDoUpdate({
        target: [categoryTranslations.categoryId, categoryTranslations.locale],
        set: { ...input, updatedAt: new Date() },
      })
      .returning();
    return record;
  }

  async deleteCategoryTranslation(categoryId: string, locale: string) {
    return db
      .delete(categoryTranslations)
      .where(and(eq(categoryTranslations.categoryId, categoryId), eq(categoryTranslations.locale, locale)))
      .returning();
  }

  async applyCategory(category: any, locale?: string) {
    if (!locale || !category?.id) return category;
    const translation = await this.getCategoryTranslation(category.id, locale);
    return mergeCategory(category, translation);
  }

  async applyCategories(items: any[], locale?: string) {
    if (!locale || !items.length) return items;
    const rows = await db
      .select()
      .from(categoryTranslations)
      .where(and(
        eq(categoryTranslations.locale, locale),
        inArray(categoryTranslations.categoryId, items.map((item) => item.id))
      ));
    const byCategory = new Map(rows.map((row) => [row.categoryId, row]));
    return items.map((item) => mergeCategory(item, byCategory.get(item.id)));
  }

  async applyCategoryTree(nodes: any[], locale?: string): Promise<any[]> {
    if (!locale || !nodes.length) return nodes;
    const flat: any[] = [];
    const collect = (items: any[]) => {
      for (const item of items) {
        flat.push(item);
        if (item.children?.length) collect(item.children);
      }
    };
    collect(nodes);

    const rows = await db
      .select()
      .from(categoryTranslations)
      .where(and(
        eq(categoryTranslations.locale, locale),
        inArray(categoryTranslations.categoryId, flat.map((item) => item.id))
      ));
    const byCategory = new Map(rows.map((row) => [row.categoryId, row]));

    const apply = (items: any[]): any[] => items.map((item) => ({
      ...mergeCategory(item, byCategory.get(item.id)),
      children: apply(item.children ?? []),
    }));

    return apply(nodes);
  }
}

export const translationService = new TranslationService();

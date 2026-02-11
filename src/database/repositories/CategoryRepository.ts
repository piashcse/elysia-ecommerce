import { BaseRepositoryImpl } from '../BaseRepository';
import { categories } from '../../schema';

export class CategoryRepository extends BaseRepositoryImpl<
  typeof categories.$inferSelect,
  typeof categories
> {
  constructor() {
    super(categories);
  }

  async findByName(name: string) {
    const [category] = await this.db
      .select()
      .from(categories)
      .where(this.db.ilike(categories.name, name))
      .limit(1);
    
    return category || null;
  }

  async findBySlug(slug: string) {
    const [category] = await this.db
      .select()
      .from(categories)
      .where(this.db.ilike(categories.slug, slug))
      .limit(1);
    
    return category || null;
  }

  async getActiveCategories() {
    return await this.db
      .select()
      .from(categories)
      .where(this.db.eq(categories.isActive, true));
  }
}
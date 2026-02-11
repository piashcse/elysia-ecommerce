import { BaseRepositoryImpl } from './BaseRepository';
import { users } from '../schema';
import { eq } from 'drizzle-orm';

export class UserRepository extends BaseRepositoryImpl<typeof users.$inferSelect, typeof users> {
  constructor() {
    super(users);
  }

  async findByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return user || null;
  }

  async findByRole(role: string) {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.role, role));
    
    return result;
  }

  async activateUser(id: string) {
    const [updatedUser] = await this.db
      .update(users)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser || null;
  }

  async deactivateUser(id: string) {
    const [updatedUser] = await this.db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser || null;
  }
}
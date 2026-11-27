import { asc, eq } from 'drizzle-orm';
import { db } from '../../../config/database';
import { productAnswers, productQuestions, products, users } from '../../../database/schema';
import { ForbiddenError, NotFoundError } from '../../../core/errors';
import { UserRole } from '../../../core/roles';

export class ProductQaService {
  async list(productId: string) {
    const questions = await db
      .select({
        id: productQuestions.id,
        question: productQuestions.question,
        createdAt: productQuestions.createdAt,
        user: { firstName: users.firstName, lastName: users.lastName },
      })
      .from(productQuestions)
      .leftJoin(users, eq(productQuestions.userId, users.id))
      .where(eq(productQuestions.productId, productId))
      .orderBy(asc(productQuestions.createdAt));

    if (!questions.length) return [];

    const answers = await db
      .select()
      .from(productAnswers)
      .orderBy(asc(productAnswers.createdAt));

    return questions.map((question) => ({
      ...question,
      answers: answers.filter((answer) => answer.questionId === question.id),
    }));
  }

  async ask(userId: string, productId: string, question: string) {
    const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1);
    if (!product) throw new NotFoundError('Product not found');
    const [record] = await db.insert(productQuestions).values({ userId, productId, question }).returning();
    return record;
  }

  async answer(actor: { sub: string; role: UserRole }, questionId: string, answer: string) {
    const [question] = await db.select().from(productQuestions).where(eq(productQuestions.id, questionId)).limit(1);
    if (!question) throw new NotFoundError('Question not found');
    const [product] = await db.select({ sellerId: products.sellerId }).from(products).where(eq(products.id, question.productId)).limit(1);
    if (actor.role !== UserRole.ADMIN && product?.sellerId !== actor.sub) {
      throw new ForbiddenError('Only the seller or admin can answer this question');
    }
    const [record] = await db.insert(productAnswers).values({ userId: actor.sub, questionId, answer }).returning();
    return record;
  }
}

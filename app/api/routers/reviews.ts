import { z } from "zod";
import { eq, desc, avg, sql } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "../middleware.js";
import { getDb } from "../queries/connection.js";
import { reviews, books, users } from "@db/schema";

export const reviewsRouter = createRouter({
  list: publicQuery
    .input(z.object({ bookId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const results = await db
        .select({
          id: reviews.id,
          bookId: reviews.bookId,
          userId: reviews.userId,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
          userName: users.name,
        })
        .from(reviews)
        .where(eq(reviews.bookId, input.bookId))
        .leftJoin(users, eq(reviews.userId, users.id))
        .orderBy(desc(reviews.createdAt));

      const avgResult = await db
        .select({ avg: avg(reviews.rating) })
        .from(reviews)
        .where(eq(reviews.bookId, input.bookId));

      return {
        reviews: results,
        averageRating: Number(avgResult[0]?.avg ?? 0),
      };
    }),

  create: publicQuery
    .input(
      z.object({
        bookId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().min(1),
        userId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const result = await db.insert(reviews).values({
        bookId: input.bookId,
        userId: input.userId,
        rating: input.rating,
        comment: input.comment,
      });

      const newReviewId = Number(result[0].insertId);

      // Update book's average rating and review count
      const avgResult = await db
        .select({ avg: avg(reviews.rating), count: sql<number>`count(*)` })
        .from(reviews)
        .where(eq(reviews.bookId, input.bookId));

      await db
        .update(books)
        .set({
          rating: Number(avgResult[0]?.avg ?? 0).toString(),
          reviewCount: avgResult[0]?.count ?? 0,
        })
        .where(eq(books.id, input.bookId));

      const newReview = await db
        .select()
        .from(reviews)
        .where(eq(reviews.id, newReviewId))
        .limit(1);

      return { review: newReview[0] };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(reviews).where(eq(reviews.id, input.id));
      return { success: true };
    }),
});

import { z } from "zod";
import { eq, desc, asc, sql, inArray, and } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { books } from "@db/schema";

export const booksRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(12),
        category: z.string().optional(),
        search: z.string().optional(),
        sortBy: z
          .enum(["price_asc", "price_desc", "newest", "rating"])
          .optional(),
        featured: z.boolean().optional(),
        bestseller: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const conditions: any[] = [];

      if (input.category) {
        conditions.push(eq(books.category, input.category as any));
      }
      if (input.search) {
        conditions.push(
          sql`${books.title} LIKE ${`%${input.search}%`} OR ${books.author} LIKE ${`%${input.search}%`}`
        );
      }
      if (input.featured) {
        conditions.push(eq(books.isFeatured, true));
      }
      if (input.bestseller) {
        conditions.push(eq(books.isBestseller, true));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      let orderBy;
      switch (input.sortBy) {
        case "price_asc":
          orderBy = asc(books.price);
          break;
        case "price_desc":
          orderBy = desc(books.price);
          break;
        case "rating":
          orderBy = desc(books.rating);
          break;
        default:
          orderBy = desc(books.createdAt);
      }

      const results = await db
        .select()
        .from(books)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(input.limit)
        .offset(offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(books)
        .where(whereClause);

      return {
        books: results,
        total: countResult[0]?.count ?? 0,
      };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const results = await db
        .select()
        .from(books)
        .where(eq(books.id, input.id))
        .limit(1);

      return { book: results[0] ?? null };
    }),

  getByIds: publicQuery
    .input(z.object({ ids: z.array(z.number()) }))
    .query(async ({ input }) => {
      const db = getDb();
      const results = await db
        .select()
        .from(books)
        .where(inArray(books.id, input.ids));

      return { books: results };
    }),

  getCategories: publicQuery.query(async () => {
    return {
      categories: [
        "fiction",
        "non-fiction",
        "science",
        "history",
        "technology",
        "childrens",
        "self-help",
        "mystery",
        "fantasy",
        "romance",
        "biography",
        "philosophy",
        "poetry",
      ],
    };
  }),

  create: adminQuery
    .input(
      z.object({
        title: z.string().min(1),
        author: z.string().min(1),
        description: z.string().min(1),
        category: z.string().min(1),
        price: z.number().positive(),
        stock: z.number().int().min(0),
        coverImage: z.string().url(),
        isbn: z.string().optional(),
        publisher: z.string().optional(),
        publishedYear: z.number().optional(),
        pages: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(books).values({
        title: input.title,
        author: input.author,
        description: input.description,
        category: input.category as any,
        price: input.price.toString(),
        stock: input.stock,
        coverImage: input.coverImage,
        isbn: input.isbn,
        publisher: input.publisher,
        publishedYear: input.publishedYear,
        pages: input.pages,
      });

      const newBook = await db
        .select()
        .from(books)
        .where(eq(books.id, Number(result[0].insertId)))
        .limit(1);

      return { book: newBook[0] };
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        author: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        price: z.number().optional(),
        stock: z.number().optional(),
        coverImage: z.string().optional(),
        isbn: z.string().optional(),
        publisher: z.string().optional(),
        publishedYear: z.number().optional(),
        pages: z.number().optional(),
        isFeatured: z.boolean().optional(),
        isBestseller: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...updateData } = input;

      const updateSet: Record<string, any> = {};
      if (updateData.title) updateSet.title = updateData.title;
      if (updateData.author) updateSet.author = updateData.author;
      if (updateData.description) updateSet.description = updateData.description;
      if (updateData.category) updateSet.category = updateData.category as any;
      if (updateData.price !== undefined) updateSet.price = updateData.price.toString();
      if (updateData.stock !== undefined) updateSet.stock = updateData.stock;
      if (updateData.coverImage) updateSet.coverImage = updateData.coverImage;
      if (updateData.isbn) updateSet.isbn = updateData.isbn;
      if (updateData.publisher) updateSet.publisher = updateData.publisher;
      if (updateData.publishedYear) updateSet.publishedYear = updateData.publishedYear;
      if (updateData.pages) updateSet.pages = updateData.pages;
      if (updateData.isFeatured !== undefined) updateSet.isFeatured = updateData.isFeatured;
      if (updateData.isBestseller !== undefined) updateSet.isBestseller = updateData.isBestseller;

      await db
        .update(books)
        .set(updateSet)
        .where(eq(books.id, id));

      const updated = await db
        .select()
        .from(books)
        .where(eq(books.id, id))
        .limit(1);

      return { book: updated[0] };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(books).where(eq(books.id, input.id));
      return { success: true };
    }),
});

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "../middleware.js";
import { getDb } from "../queries/connection.js";
import { env } from "../lib/env.js";
import {
  addOrUpdateLocalCartItem,
  clearLocalCart,
  getLocalCartItems,
  removeLocalCartItem,
  updateLocalCartItem,
} from "../queries/localCart.js";
import { cartItems, books } from "@db/schema";
import { verifyToken } from "../lib/jwt.js";

const BOOK_CATEGORIES = [
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
];

function normalizeCategory(category: string | undefined | null) {
  const normalized = String(category ?? "")
    .toLowerCase()
    .trim();
  return BOOK_CATEGORIES.includes(normalized) ? (normalized as any) : "fiction";
}

function getAuthUser(headers: Headers) {
  const authHeader = headers.get("x-auth-token") || headers.get("X-Auth-Token");
  if (!authHeader) return null;
  try {
    return verifyToken(authHeader);
  } catch {
    return null;
  }
}

export const cartRouter = createRouter({
  list: publicQuery.query(async ({ ctx }) => {
    const user = getAuthUser(ctx.req.headers);
    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    if (!env.databaseUrl) {
      const items = await getLocalCartItems(user.userId);
      return {
        items: items.map(item => ({
          ...item,
          createdAt: new Date(item.createdAt),
        })),
      };
    }

    const db = getDb();
    const items = await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        bookId: cartItems.bookId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        book: {
          id: books.id,
          title: books.title,
          author: books.author,
          price: books.price,
          coverImage: books.coverImage,
          stock: books.stock,
        },
      })
      .from(cartItems)
      .where(eq(cartItems.userId, user.userId))
      .leftJoin(books, eq(cartItems.bookId, books.id));

    return { items };
  }),

  add: publicQuery
    .input(
      z.object({ bookId: z.number(), quantity: z.number().min(1).default(1) })
    )
    .mutation(async ({ ctx, input }) => {
      const user = getAuthUser(ctx.req.headers);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      if (!env.databaseUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Book lookup is unavailable without a database. Add external books from search instead.",
        });
      }

      const db = getDb();

      const existing = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.userId, user.userId),
            eq(cartItems.bookId, input.bookId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(cartItems)
          .set({ quantity: existing[0].quantity + input.quantity })
          .where(eq(cartItems.id, existing[0].id));

        const updated = await db
          .select()
          .from(cartItems)
          .where(eq(cartItems.id, existing[0].id))
          .limit(1);

        return { item: updated[0] };
      }

      const result = await db.insert(cartItems).values({
        userId: user.userId,
        bookId: input.bookId,
        quantity: input.quantity,
      });

      const newItem = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.id, Number(result[0].insertId)))
        .limit(1);

      return { item: newItem[0] };
    }),

  addExternal: publicQuery
    .input(
      z.object({
        title: z.string().min(1),
        author: z.string().min(1),
        description: z.string().min(1),
        category: z.string().optional(),
        price: z.string().optional(),
        coverImage: z.string().url(),
        isbn: z.string().optional(),
        publisher: z.string().optional(),
        publishedYear: z.number().optional(),
        pages: z.number().optional(),
        language: z.string().optional(),
        quantity: z.number().min(1).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = getAuthUser(ctx.req.headers);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      if (!env.databaseUrl) {
        const localItem = await addOrUpdateLocalCartItem(
          user.userId,
          {
            id: input.isbn ? input.isbn : `${input.title}:${input.author}`,
            title: input.title,
            author: input.author,
            price: input.price ?? "12.99",
            coverImage: input.coverImage,
            stock: null,
          },
          input.quantity
        );
        return {
          item: {
            ...localItem,
            createdAt: new Date(localItem.createdAt),
          },
        };
      }

      const db = getDb();
      const category = normalizeCategory(input.category);
      const priceValue = Number(input.price ?? "0");
      const bookPrice =
        Number.isFinite(priceValue) && priceValue > 0 ? priceValue : 12.99;

      const existingBooks = await db
        .select()
        .from(books)
        .where(
          and(eq(books.title, input.title), eq(books.author, input.author))
        )
        .limit(1);

      let bookId: number;
      if (existingBooks.length > 0) {
        bookId = existingBooks[0].id;
      } else {
        const result = await db.insert(books).values({
          title: input.title,
          author: input.author,
          description: input.description,
          category,
          price: bookPrice.toString(),
          stock: 10,
          coverImage: input.coverImage,
          isbn: input.isbn,
          publisher: input.publisher,
          publishedYear: input.publishedYear,
          pages: input.pages,
          language: input.language ?? "English",
        });
        bookId = Number(result[0].insertId);
      }

      const existing = await db
        .select()
        .from(cartItems)
        .where(
          and(eq(cartItems.userId, user.userId), eq(cartItems.bookId, bookId))
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(cartItems)
          .set({ quantity: existing[0].quantity + input.quantity })
          .where(eq(cartItems.id, existing[0].id));

        const updated = await db
          .select()
          .from(cartItems)
          .where(eq(cartItems.id, existing[0].id))
          .limit(1);

        return { item: updated[0] };
      }

      const result = await db.insert(cartItems).values({
        userId: user.userId,
        bookId,
        quantity: input.quantity,
      });

      const newItem = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.id, Number(result[0].insertId)))
        .limit(1);

      return { item: newItem[0] };
    }),

  update: publicQuery
    .input(z.object({ itemId: z.number(), quantity: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const user = getAuthUser(ctx.req.headers);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      if (!env.databaseUrl) {
        const item = await updateLocalCartItem(input.itemId, input.quantity);
        if (!item) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cart item not found",
          });
        }
        return { item: { ...item, createdAt: new Date(item.createdAt) } };
      }

      const db = getDb();
      await db
        .update(cartItems)
        .set({ quantity: input.quantity })
        .where(eq(cartItems.id, input.itemId));

      const updated = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.id, input.itemId))
        .limit(1);

      return { item: updated[0] };
    }),

  remove: publicQuery
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const user = getAuthUser(ctx.req.headers);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      if (!env.databaseUrl) {
        await removeLocalCartItem(input.itemId);
        return { success: true };
      }

      const db = getDb();
      await db.delete(cartItems).where(eq(cartItems.id, input.itemId));
      return { success: true };
    }),

  clear: publicQuery.mutation(async ({ ctx }) => {
    const user = getAuthUser(ctx.req.headers);
    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    if (!env.databaseUrl) {
      await clearLocalCart(user.userId);
      return { success: true };
    }

    const db = getDb();
    await db.delete(cartItems).where(eq(cartItems.userId, user.userId));
    return { success: true };
  }),
});

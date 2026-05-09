import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { env } from "../lib/env";
import { orders, orderItems, books, cartItems, users } from "@db/schema";
import { verifyToken } from "../lib/jwt";
import {
  createLocalOrder,
  getLocalOrderById,
  getLocalOrders,
} from "../queries/localOrders";
import { clearLocalCart, getLocalCartItems } from "../queries/localCart";

function getAuthUser(headers: Headers) {
  const authHeader = headers.get("x-auth-token") || headers.get("X-Auth-Token");
  if (!authHeader) return null;
  try {
    return verifyToken(authHeader);
  } catch {
    return null;
  }
}

export const ordersRouter = createRouter({
  list: publicQuery
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = getAuthUser(ctx.req.headers);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      if (!env.databaseUrl) {
        const orders = await getLocalOrders(user.userId);
        return { orders, total: orders.length };
      }

      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const results = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, user.userId))
        .orderBy(desc(orders.createdAt))
        .limit(input.limit)
        .offset(offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.userId, user.userId));

      return {
        orders: results,
        total: countResult[0]?.count ?? 0,
      };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const user = getAuthUser(ctx.req.headers);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      if (!env.databaseUrl) {
        const order = await getLocalOrderById(input.id);
        if (!order) {
          return { order: null };
        }
        if (order.userId !== user.userId && user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to view this order",
          });
        }
        return { order };
      }

      const db = getDb();
      const orderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.id))
        .limit(1);

      if (orderResult.length === 0) {
        return { order: null };
      }

      const order = orderResult[0];

      if (order.userId !== user.userId && user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view this order",
        });
      }

      const items = await db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          bookId: orderItems.bookId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          book: {
            id: books.id,
            title: books.title,
            author: books.author,
            coverImage: books.coverImage,
          },
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, input.id))
        .leftJoin(books, eq(orderItems.bookId, books.id));

      return {
        order: {
          ...order,
          items,
        },
      };
    }),

  create: publicQuery
    .input(
      z.object({
        shippingName: z.string().min(1),
        shippingEmail: z.string().email(),
        shippingPhone: z.string().optional(),
        shippingAddress: z.string().min(1),
        paymentMethod: z.enum(["credit_card", "paypal", "cod"]),
        notes: z.string().optional(),
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
        const cartItems = await getLocalCartItems(user.userId);
        if (cartItems.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cart is empty",
          });
        }

        const order = await createLocalOrder(
          user.userId,
          cartItems,
          input.shippingName,
          input.shippingEmail,
          input.shippingPhone ?? null,
          input.shippingAddress,
          input.paymentMethod,
          input.notes ?? null
        );
        await clearLocalCart(user.userId);
        return { order };
      }

      const db = getDb();

      const cartResults = await db
        .select({
          cartId: cartItems.id,
          bookId: cartItems.bookId,
          quantity: cartItems.quantity,
          bookPrice: books.price,
          bookStock: books.stock,
        })
        .from(cartItems)
        .where(eq(cartItems.userId, user.userId))
        .leftJoin(books, eq(cartItems.bookId, books.id));

      if (cartResults.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cart is empty",
        });
      }

      let total = 0;
      for (const item of cartResults) {
        const price = Number(item.bookPrice);
        total += price * item.quantity;
      }

      const orderResult = await db.insert(orders).values({
        userId: user.userId,
        total: total.toFixed(2),
        shippingName: input.shippingName,
        shippingEmail: input.shippingEmail,
        shippingPhone: input.shippingPhone,
        shippingAddress: input.shippingAddress,
        paymentMethod: input.paymentMethod,
        notes: input.notes,
      });

      const orderId = Number(orderResult[0].insertId);

      for (const item of cartResults) {
        const itemPrice = item.bookPrice ?? "0";
        await db.insert(orderItems).values({
          orderId,
          bookId: item.bookId,
          quantity: item.quantity,
          price: itemPrice,
        });

        if (item.bookStock !== null && item.bookStock !== undefined) {
          await db
            .update(books)
            .set({ stock: Math.max(0, item.bookStock - item.quantity) })
            .where(eq(books.id, item.bookId));
        }
      }

      await db.delete(cartItems).where(eq(cartItems.userId, user.userId));

      const newOrder = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      return { order: newOrder[0] };
    }),

  listAll: adminQuery
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        status: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const conditions = [];
      if (input.status) {
        conditions.push(eq(orders.status, input.status as any));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const results = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          status: orders.status,
          total: orders.total,
          shippingName: orders.shippingName,
          shippingEmail: orders.shippingEmail,
          shippingPhone: orders.shippingPhone,
          shippingAddress: orders.shippingAddress,
          paymentMethod: orders.paymentMethod,
          notes: orders.notes,
          createdAt: orders.createdAt,
          userName: users.name,
        })
        .from(orders)
        .where(whereClause)
        .leftJoin(users, eq(orders.userId, users.id))
        .orderBy(desc(orders.createdAt))
        .limit(input.limit)
        .offset(offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(whereClause);

      return {
        orders: results,
        total: countResult[0]?.count ?? 0,
      };
    }),

  updateStatus: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum([
          "pending",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(orders)
        .set({ status: input.status })
        .where(eq(orders.id, input.id));

      const updated = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.id))
        .limit(1);

      return { order: updated[0] };
    }),
});

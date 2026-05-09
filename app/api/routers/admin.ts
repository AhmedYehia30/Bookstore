import { eq, desc, sql, lt } from "drizzle-orm";
import { z } from "zod";
import { createRouter, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { books, orders, users } from "@db/schema";

export const adminRouter = createRouter({
  getStats: adminQuery.query(async () => {
    const db = getDb();

    const totalBooks = await db
      .select({ count: sql<number>`count(*)` })
      .from(books);

    const totalOrders = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders);

    const totalUsers = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const totalRevenue = await db
      .select({ total: sql<string>`COALESCE(SUM(${orders.total}), 0)` })
      .from(orders)
      .where(eq(orders.status, "delivered"));

    const recentOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        total: orders.total,
        shippingName: orders.shippingName,
        shippingEmail: orders.shippingEmail,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5);

    const lowStockBooks = await db
      .select()
      .from(books)
      .where(lt(books.stock, 5))
      .limit(5);

    return {
      totalBooks: totalBooks[0]?.count ?? 0,
      totalOrders: totalOrders[0]?.count ?? 0,
      totalUsers: totalUsers[0]?.count ?? 0,
      totalRevenue: Number(totalRevenue[0]?.total ?? 0),
      recentOrders,
      lowStockBooks,
    };
  }),

  getUsers: adminQuery
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const results = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          avatar: users.avatar,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(input.limit)
        .offset(offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);

      return {
        users: results,
        total: countResult[0]?.count ?? 0,
      };
    }),

  updateUserRole: adminQuery
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));

      const updated = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      return { user: updated[0] };
    }),

  getSalesChart: adminQuery.query(async () => {
    const db = getDb();
    const results = await db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`,
        count: sql<number>`count(*)`,
        revenue: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
      })
      .from(orders)
      .where(
        sql`${orders.createdAt} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
      )
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

    return { data: results };
  }),
});

import { authRouter } from "./auth-router";
import { customAuthRouter } from "./routers/customAuth";
import { booksRouter } from "./routers/books";
import { reviewsRouter } from "./routers/reviews";
import { cartRouter } from "./routers/cart";
import { ordersRouter } from "./routers/orders";
import { adminRouter } from "./routers/admin";
import { chatRouter } from "./routers/chat";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  customAuth: customAuthRouter,
  books: booksRouter,
  reviews: reviewsRouter,
  cart: cartRouter,
  orders: ordersRouter,
  admin: adminRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;

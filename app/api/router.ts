import { authRouter } from "./auth-router.js";
import { customAuthRouter } from "./routers/customAuth.js";
import { booksRouter } from "./routers/books.js";
import { reviewsRouter } from "./routers/reviews.js";
import { cartRouter } from "./routers/cart.js";
import { ordersRouter } from "./routers/orders.js";
import { adminRouter } from "./routers/admin.js";
import { chatRouter } from "./routers/chat.js";
import { createRouter, publicQuery } from "./middleware.js";

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

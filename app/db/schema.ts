import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  int,
  boolean,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatar: varchar("avatar", { length: 500 }),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const books = mysqlTable("books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", [
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
  ]).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: int("stock").notNull().default(0),
  coverImage: varchar("coverImage", { length: 500 }).notNull(),
  isbn: varchar("isbn", { length: 20 }),
  publisher: varchar("publisher", { length: 255 }),
  publishedYear: int("publishedYear"),
  pages: int("pages"),
  language: varchar("language", { length: 50 }).default("English"),
  isFeatured: boolean("isFeatured").default(false),
  isBestseller: boolean("isBestseller").default(false),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0.0"),
  reviewCount: int("reviewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const reviews = mysqlTable("reviews", {
  id: serial("id").primaryKey(),
  bookId: bigint("bookId", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  rating: int("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const cartItems = mysqlTable("cartItems", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  bookId: bigint("bookId", { mode: "number", unsigned: true }).notNull(),
  quantity: int("quantity").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  status: mysqlEnum("status", [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ])
    .default("pending")
    .notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  shippingName: varchar("shippingName", { length: 255 }).notNull(),
  shippingEmail: varchar("shippingEmail", { length: 255 }).notNull(),
  shippingPhone: varchar("shippingPhone", { length: 20 }),
  shippingAddress: text("shippingAddress").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["credit_card", "paypal", "cod"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const orderItems = mysqlTable("orderItems", {
  id: serial("id").primaryKey(),
  orderId: bigint("orderId", { mode: "number", unsigned: true }).notNull(),
  bookId: bigint("bookId", { mode: "number", unsigned: true }).notNull(),
  quantity: int("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Book = typeof books.$inferSelect;
export type InsertBook = typeof books.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

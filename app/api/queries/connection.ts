import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env.js";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!env.databaseUrl) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }
  if (!instance) {
    instance = drizzle(env.databaseUrl, {
      mode: "planetscale",
      schema: fullSchema,
    });
  }
  return instance;
}

export async function initDb() {
  if (!env.databaseUrl) {
    return;
  }
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(320) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
      avatar VARCHAR(500),
      address TEXT,
      phone VARCHAR(20),
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS books (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      category ENUM('fiction','non-fiction','science','history','technology','childrens','self-help','mystery','fantasy','romance','biography','philosophy','poetry') NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      coverImage VARCHAR(500) NOT NULL,
      isbn VARCHAR(20),
      publisher VARCHAR(255),
      publishedYear INT,
      pages INT,
      language VARCHAR(50) NOT NULL DEFAULT 'English',
      isFeatured BOOLEAN NOT NULL DEFAULT FALSE,
      isBestseller BOOLEAN NOT NULL DEFAULT FALSE,
      rating DECIMAL(2,1) NOT NULL DEFAULT 0.0,
      reviewCount INT NOT NULL DEFAULT 0,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bookId BIGINT UNSIGNED NOT NULL,
      userId BIGINT UNSIGNED NOT NULL,
      rating INT NOT NULL,
      comment TEXT NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS cartItems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId BIGINT UNSIGNED NOT NULL,
      bookId BIGINT UNSIGNED NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId BIGINT UNSIGNED NOT NULL,
      status ENUM('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
      total DECIMAL(10,2) NOT NULL,
      shippingName VARCHAR(255) NOT NULL,
      shippingEmail VARCHAR(255) NOT NULL,
      shippingPhone VARCHAR(20),
      shippingAddress TEXT NOT NULL,
      paymentMethod ENUM('credit_card','paypal','cod') NOT NULL,
      notes TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS orderItems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderId BIGINT UNSIGNED NOT NULL,
      bookId BIGINT UNSIGNED NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(10,2) NOT NULL
    )
  `);
}

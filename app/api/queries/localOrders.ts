import fs from "fs/promises";
import type { LocalCartItem } from "./localCart";

export interface LocalOrderItem {
  id: string;
  orderId: number;
  bookId: string;
  quantity: number;
  price: string;
  book: {
    id: string | number;
    title: string;
    author: string;
    coverImage: string;
  };
}

export interface LocalOrder {
  id: number;
  userId: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total: string;
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string | null;
  shippingAddress: string;
  paymentMethod: "credit_card" | "paypal" | "cod";
  notes: string | null;
  createdAt: string;
  items: LocalOrderItem[];
}

const localOrdersFile = new URL("../data/orders.json", import.meta.url);

async function readLocalOrders(): Promise<LocalOrder[]> {
  try {
    const content = await fs.readFile(localOrdersFile, "utf-8");
    const parsed = JSON.parse(content) as LocalOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      await fs.mkdir(new URL("../data", import.meta.url), { recursive: true });
      return [];
    }
    throw error;
  }
}

async function writeLocalOrders(orders: LocalOrder[]) {
  await fs.mkdir(new URL("../data", import.meta.url), { recursive: true });
  await fs.writeFile(localOrdersFile, JSON.stringify(orders, null, 2), "utf-8");
}

export async function getLocalOrders(userId: number) {
  const orders = await readLocalOrders();
  return orders.filter(order => order.userId === userId);
}

export async function getLocalOrderById(id: number) {
  const orders = await readLocalOrders();
  return orders.find(order => order.id === id) ?? null;
}

export async function createLocalOrder(
  userId: number,
  items: LocalCartItem[],
  shippingName: string,
  shippingEmail: string,
  shippingPhone: string | null,
  shippingAddress: string,
  paymentMethod: "credit_card" | "paypal" | "cod",
  notes: string | null
) {
  const orders = await readLocalOrders();
  const nextId = orders.reduce((max, order) => Math.max(max, order.id), 0) + 1;
  const total = items.reduce(
    (sum, item) => sum + Number(item.book.price) * item.quantity,
    0
  );
  const orderItems: LocalOrderItem[] = items.map(item => ({
    id: `order-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    orderId: nextId,
    bookId: item.bookId,
    quantity: item.quantity,
    price: item.book.price,
    book: {
      id: item.book.id,
      title: item.book.title,
      author: item.book.author,
      coverImage: item.book.coverImage,
    },
  }));

  const newOrder: LocalOrder = {
    id: nextId,
    userId,
    status: "pending",
    total: total.toFixed(2),
    shippingName,
    shippingEmail,
    shippingPhone,
    shippingAddress,
    paymentMethod,
    notes,
    createdAt: new Date().toISOString(),
    items: orderItems,
  };

  orders.push(newOrder);
  await writeLocalOrders(orders);
  return newOrder;
}

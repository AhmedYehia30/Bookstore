import fs from "fs/promises";

export interface LocalCartBook {
  id: string | number;
  title: string;
  author: string;
  price: string;
  coverImage: string;
  stock: number | null;
}

export interface LocalCartItem {
  id: number;
  userId: number;
  bookId: string;
  quantity: number;
  createdAt: string;
  book: LocalCartBook;
}

const localCartFile = new URL("../data/cart.json", import.meta.url);

async function readLocalCart(): Promise<LocalCartItem[]> {
  try {
    const content = await fs.readFile(localCartFile, "utf-8");
    const parsed = JSON.parse(content) as LocalCartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      await fs.mkdir(new URL("../data", import.meta.url), { recursive: true });
      return [];
    }
    throw error;
  }
}

async function writeLocalCart(items: LocalCartItem[]) {
  await fs.mkdir(new URL("../data", import.meta.url), { recursive: true });
  await fs.writeFile(localCartFile, JSON.stringify(items, null, 2), "utf-8");
}

export async function getLocalCartItems(userId: number) {
  const items = await readLocalCart();
  return items.filter(item => item.userId === userId);
}

export async function addOrUpdateLocalCartItem(
  userId: number,
  book: LocalCartBook,
  quantity: number
) {
  const items = await readLocalCart();
  const bookKey = String(book.id);
  const index = items.findIndex(
    item => item.userId === userId && String(item.bookId) === bookKey
  );
  if (index >= 0) {
    items[index].quantity += quantity;
    items[index].createdAt = new Date().toISOString();
    await writeLocalCart(items);
    return items[index];
  }

  const newItem: LocalCartItem = {
    id: items.reduce((max, item) => Math.max(max, item.id), 0) + 1,
    userId,
    bookId: bookKey,
    quantity,
    createdAt: new Date().toISOString(),
    book,
  };

  items.push(newItem);
  await writeLocalCart(items);
  return newItem;
}

export async function updateLocalCartItem(itemId: number, quantity: number) {
  const items = await readLocalCart();
  const index = items.findIndex(item => item.id === itemId);
  if (index >= 0) {
    items[index].quantity = quantity;
    await writeLocalCart(items);
    return items[index];
  }
  return null;
}

export async function removeLocalCartItem(itemId: number) {
  const items = await readLocalCart();
  const filtered = items.filter(item => item.id !== itemId);
  await writeLocalCart(filtered);
}

export async function clearLocalCart(userId: number) {
  const items = await readLocalCart();
  await writeLocalCart(items.filter(item => item.userId !== userId));
}

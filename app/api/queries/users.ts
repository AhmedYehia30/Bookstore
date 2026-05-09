import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertUser } from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";
import fs from "fs/promises";

type LocalUser = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  avatar: string | null;
  address: string | null;
  phone: string | null;
  createdAt: Date;
};

const localUsersFile = new URL("../data/users.json", import.meta.url);

async function readLocalUsers(): Promise<LocalUser[]> {
  try {
    const content = await fs.readFile(localUsersFile, "utf-8");
    const raw = JSON.parse(content) as Array<
      Omit<LocalUser, "createdAt"> & { createdAt: string }
    >;
    return raw.map(user => ({
      ...user,
      createdAt: new Date(user.createdAt),
    }));
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      await fs.mkdir(new URL("../data", import.meta.url), { recursive: true });
      return [];
    }
    throw error;
  }
}

async function writeLocalUsers(users: LocalUser[]) {
  await fs.mkdir(new URL("../data", import.meta.url), { recursive: true });
  await fs.writeFile(localUsersFile, JSON.stringify(users, null, 2), "utf-8");
}

export async function findUserByEmail(email: string) {
  if (!env.databaseUrl) {
    const users = await readLocalUsers();
    return users.find(user => user.email === email) ?? null;
  }
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  return rows.at(0);
}

export async function createUser(data: InsertUser) {
  if (!env.databaseUrl) {
    const users = await readLocalUsers();
    const nextId = users.reduce((max, user) => Math.max(max, user.id), 0) + 1;
    const newUser: LocalUser = {
      id: nextId,
      name: data.name,
      email: data.email,
      password: data.password,
      role: (data.role as "user" | "admin") ?? "user",
      avatar: data.avatar ?? null,
      address: data.address ?? null,
      phone: data.phone ?? null,
      createdAt: new Date(),
    };
    users.push(newUser);
    await writeLocalUsers(users);
    return newUser;
  }
  const result = await getDb().insert(schema.users).values(data);
  return result;
}

export async function findUserById(id: number) {
  if (!env.databaseUrl) {
    const users = await readLocalUsers();
    return users.find(user => user.id === id) ?? null;
  }
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  return rows.at(0);
}

export async function updateUserProfile(id: number, data: Partial<InsertUser>) {
  if (!env.databaseUrl) {
    const users = await readLocalUsers();
    const index = users.findIndex(user => user.id === id);
    if (index === -1) {
      return null;
    }
    const updated: LocalUser = {
      ...users[index],
      ...{
        name: data.name ?? users[index].name,
        avatar: data.avatar ?? users[index].avatar,
        address: data.address ?? users[index].address,
        phone: data.phone ?? users[index].phone,
      },
    };
    users[index] = updated;
    await writeLocalUsers(users);
    return updated;
  }
  await getDb()
    .update(schema.users)
    .set({
      ...(data.name && { name: data.name }),
      ...(data.avatar && { avatar: data.avatar }),
      ...(data.address && { address: data.address }),
      ...(data.phone && { phone: data.phone }),
    })
    .where(eq(schema.users.id, id));
  return findUserById(id);
}

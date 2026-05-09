import jwt from "jsonwebtoken";
import { env } from "./env";

const JWT_SECRET = env.jwtSecret || "bookhaven-secret-key-change-in-production";

export function signToken(payload: { userId: number; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: number; email: string; role: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string };
}

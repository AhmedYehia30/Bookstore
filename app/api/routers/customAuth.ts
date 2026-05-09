import { z } from "zod";
import bcrypt from "bcryptjs";
import { createRouter, publicQuery } from "../middleware.js";
import {
  findUserByEmail,
  createUser,
  findUserById,
  updateUserProfile,
} from "../queries/users.js";
import { signToken, verifyToken } from "../lib/jwt.js";
import { TRPCError } from "@trpc/server";

export const customAuthRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await findUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      await createUser({
        name: input.name,
        email: input.email,
        password: hashedPassword,
      });
      const createdUser = await findUserByEmail(input.email);
      const userId = Number(createdUser?.id ?? 0);
      const token = signToken({
        userId,
        email: input.email,
        role: "user",
      });

      return {
        user: {
          id: userId,
          name: input.name,
          email: input.email,
          role: "user",
        },
        token,
      };
    }),

  login: publicQuery
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input }) => {
      const results = await findUserByEmail(input.email);
      if (!results) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const user = results;
      const isValid = await bcrypt.compare(input.password, user.password);

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          address: user.address,
          phone: user.phone,
        },
        token,
      };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    const authHeader =
      ctx.req.headers.get("x-auth-token") ||
      ctx.req.headers.get("X-Auth-Token");

    if (!authHeader) {
      return null;
    }

    try {
      const decoded = verifyToken(authHeader);
      const user = await findUserById(decoded.userId);
      if (!user) {
        return null;
      }
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        address: user.address,
        phone: user.phone,
      };
    } catch {
      return null;
    }
  }),

  updateProfile: publicQuery
    .input(
      z.object({
        name: z.string().min(2).optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authHeader =
        ctx.req.headers.get("x-auth-token") ||
        ctx.req.headers.get("X-Auth-Token");

      if (!authHeader) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      const decoded = verifyToken(authHeader);
      const user = await updateUserProfile(decoded.userId, input);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        address: user.address,
        phone: user.phone,
      };
    }),
});

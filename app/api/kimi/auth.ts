import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import * as jose from "jose";
import * as cookie from "cookie";
import { env } from "../lib/env.js";
import { getSessionCookieOptions } from "../lib/cookies.js";
import { Session } from "@contracts/constants";
import { Errors } from "@contracts/errors";
import { signSessionToken, verifySessionToken } from "./session.js";
import { users as kimiUsers } from "./platform.js";
import { findUserByEmail, createUser } from "../queries/users.js";
import type { TokenResponse } from "./types.js";

async function exchangeAuthCode(
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  if (!env.appId) {
    throw new Error("Missing required environment variable: APP_ID");
  }
  if (!env.appSecret) {
    throw new Error("Missing required environment variable: APP_SECRET");
  }
  if (!env.kimiAuthUrl) {
    throw new Error("Missing required environment variable: KIMI_AUTH_URL");
  }
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.appId,
    redirect_uri: redirectUri,
    client_secret: env.appSecret,
  });

  const resp = await fetch(`${env.kimiAuthUrl}/api/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed (${resp.status}): ${text}`);
  }

  return resp.json() as Promise<TokenResponse>;
}

async function verifyAccessToken(
  accessToken: string
): Promise<{ userId: string; clientId: string }> {
  if (!env.kimiAuthUrl) {
    throw new Error("Missing required environment variable: KIMI_AUTH_URL");
  }
  const jwks = jose.createRemoteJWKSet(
    new URL(`${env.kimiAuthUrl}/api/.well-known/jwks.json`)
  );
  const { payload } = await jose.jwtVerify(accessToken, jwks);
  const userId = payload.user_id as string;
  const clientId = payload.client_id as string;
  if (!userId) {
    throw new Error("user_id missing from access token");
  }
  return { userId, clientId };
}

export async function authenticateRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  if (!token) {
    console.warn("[auth] No session cookie found in request.");
    throw Errors.forbidden("Invalid authentication token.");
  }
  const claim = await verifySessionToken(token);
  if (!claim) {
    throw Errors.forbidden("Invalid authentication token.");
  }
  // Use email from claim to find user
  const user = await findUserByEmail(claim.unionId);
  if (!user) {
    throw Errors.forbidden("User not found. Please re-login.");
  }
  return user;
}

export function createOAuthCallbackHandler() {
  return async (c: Context) => {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const error = c.req.query("error");
    const errorDescription = c.req.query("error_description");

    if (error) {
      if (error === "access_denied") {
        return c.redirect("/", 302);
      }
      return c.json({ error, error_description: errorDescription }, 400);
    }

    if (!code || !state) {
      return c.json({ error: "code and state are required" }, 400);
    }

    try {
      const redirectUri = atob(state);
      const tokenResp = await exchangeAuthCode(code, redirectUri);
      const { userId } = await verifyAccessToken(tokenResp.access_token);
      const userProfile = await kimiUsers.getProfile(tokenResp.access_token);
      if (!userProfile) {
        throw new Error("Failed to fetch user profile from Kimi Open");
      }

      // Check if user exists
      const existingUser = await findUserByEmail(userProfile.email || userId);
      if (!existingUser) {
        await createUser({
          name: userProfile.name,
          email: userProfile.email || `${userId}@oauth.local`,
          password: "oauth_user_no_password",
          avatar: userProfile.avatar_url,
        });
      }

      const token = await signSessionToken({
        unionId: userProfile.email || userId,
        clientId: env.appId,
      });

      const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
      setCookie(c, Session.cookieName, token, {
        ...cookieOpts,
        maxAge: Session.maxAgeMs / 1000,
      });

      return c.redirect("/", 302);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      return c.json({ error: "OAuth callback failed" }, 500);
    }
  };
}

export { exchangeAuthCode, verifyAccessToken };

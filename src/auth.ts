import { Agent } from "@atproto/api";
import { JoseKey } from "@atproto/jwk-jose";
import {
  NodeOAuthClient,
  NodeSavedSession,
  NodeSavedState,
} from "@atproto/oauth-client-node";
import { cache } from "react";
import * as v from "valibot";

import { buildMutex } from "./db";
import { EncryptedCookie } from "./encrypted-cookie";

export const sessionCookie = new EncryptedCookie<{
  sub: string;
  session: NodeSavedSession;
}>("session");

const authStateCookie = new EncryptedCookie<{
  key: string;
  state: NodeSavedState;
}>("auth_state");

const privateKeyPKCS8 = Buffer.from(
  process.env.PRIVATE_KEY_ES256_B64 as string,
  "base64",
).toString();
const privateKey = await JoseKey.fromImportable(privateKeyPKCS8, "key1");

const isDev = process.env.NODE_ENV == "development";
const origin = isDev ? "http://127.0.0.1:3000" : "https://skylights.my";

const abs = (s: string) => `${origin}/${s}`;
const enc = encodeURIComponent;

const SCOPE = "atproto transition:generic";
const REDIRECT_URI = abs("oauth/atproto-callback");

export const authClient = new NodeOAuthClient({
  clientMetadata: {
    client_id: isDev
      ? `http://localhost?redirect_uri=${enc(REDIRECT_URI)}&scope=${enc(SCOPE)}`
      : abs("oauth/client-metadata.json"),
    client_name: "Skylights",
    client_uri: origin,
    redirect_uris: [REDIRECT_URI],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    application_type: "web",
    scope: SCOPE,
    token_endpoint_auth_method: "private_key_jwt",
    token_endpoint_auth_signing_alg: "ES256",
    dpop_bound_access_tokens: true,
    jwks_uri: abs("oauth/jwks.json"),
  },

  keyset: [privateKey],

  stateStore: {
    set: (key, state) => authStateCookie.create({ key, state }),
    async get(key) {
      const cookie = await authStateCookie.get();
      return cookie?.key == key ? cookie.state : undefined;
    },
    del: () => authStateCookie.delete(),
  },

  sessionStore: {
    set: (sub, session) => {
      return sessionCookie.create({
        sub,
        session,
        expires: session.tokenSet.expires_at
          ? new Date(session.tokenSet.expires_at)
          : undefined,
      });
    },
    async get(sub) {
      const payload = await sessionCookie.get();
      if (payload?.sub == sub) {
        return payload.session;
      }
    },
    del: () => sessionCookie.delete(),
  },

  async requestLock(name, fn) {
    let result: ReturnType<typeof fn>;
    await buildMutex(`request-lock-${name}`).withLock(async () => {
      result = await fn();
    });
    return result!;
  },
});

export const AuthStateSchema = v.object({
  returnTo: v.optional(v.pipe(v.string(), v.startsWith("/"))),
});
export type AuthState = v.InferInput<typeof AuthStateSchema>;

export const getSessionAgent = cache(async (refresh?: boolean | "auto") => {
  const cookie = await sessionCookie.get();
  if (!cookie) return null;
  try {
    const session = await authClient.restore(cookie.sub, refresh);
    if ((await session.getTokenInfo(refresh)).expired) return null;
    return new Agent(session);
  } catch (error) {
    console.error("Failed to restore session", error);
    return null;
  }
});

export const assertSessionAgent = cache(async () => {
  const agent = await getSessionAgent();
  if (!agent) throw new Error("Missing session");
  return agent;
});

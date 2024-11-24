import { Agent } from "@atproto/api";
import {
  NodeOAuthClient,
  NodeSavedSession,
  NodeSavedState,
} from "@atproto/oauth-client-node";

import { EncryptedCookie } from "./encrypted-cookie";

export const sessionCookie = new EncryptedCookie<{
  sub: string;
  session: NodeSavedSession;
}>("session");

const authStateCookie = new EncryptedCookie<{
  key: string;
  state: NodeSavedState;
}>("auth_state");

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
    // logo_uri: abs("logo.png"),
    tos_uri: abs("tos"),
    policy_uri: abs("policy"),
    redirect_uris: [REDIRECT_URI],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    application_type: "web",
    scope: SCOPE,
    token_endpoint_auth_method: "none",
    // token_endpoint_auth_method: "private_key_jwt",
    // token_endpoint_auth_signing_alg: "RS256",
    dpop_bound_access_tokens: true,
    // jwks_uri: abs("oauth/jwks.json"),
  },

  // keyset: await Promise.all([
  //   // JoseKey.fromKeyLike(new TextEncoder().encode(process.env.PRIVATE_KEY!)),
  //   JoseKey.fromKeyLike(scrt.privateKey),
  // ]),

  stateStore: {
    set: (key, state) => authStateCookie.create({ key, state }),
    async get(key) {
      const cookie = await authStateCookie.get();
      return cookie?.key == key ? cookie.state : undefined;
    },
    // TODO: not possible to delete cookies in RSCs, unsure how to solve for this one
    del: () => {}, //authStateCookie.delete(key),
  },

  sessionStore: {
    set: (sub, session) => sessionCookie.create({ sub, session }),
    async get(sub) {
      const payload = await sessionCookie.get();
      if (payload?.sub == sub) {
        return payload.session;
      }
    },
    del: () => {}, //sessionCookie.delete(key),
  },
});

export async function getSessionAgent(refresh?: boolean | "auto") {
  const cookie = await sessionCookie.get();
  if (!cookie) return null;
  const session = await authClient.restore(cookie.sub, refresh);
  if ((await session.getTokenInfo(refresh)).expired) return null;
  return new Agent(session);
}

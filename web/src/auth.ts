import {
  NodeOAuthClient,
  NodeSavedSession,
  NodeSavedState,
} from "@atproto/oauth-client-node";

import { EncryptedCookie } from "./encrypted-cookie";

const sessionCookie = new EncryptedCookie<{
  sub: string;
  session: NodeSavedSession;
}>("session");
const authStateCookie = new EncryptedCookie<{
  key: string;
  state: NodeSavedState;
}>("auth_state");

const IS_DEV = process.env.NODE_ENV == "development";
const ORIGIN = IS_DEV ? "http://127.0.0.1:3000" : "https://skylights.my";
const abs = (s: string) => `${ORIGIN}/${s}`;
const enc = encodeURIComponent;
export const authClient = new NodeOAuthClient({
  clientMetadata: {
    client_id: IS_DEV
      ? `http://localhost?redirect_uri=${enc(abs("atproto-oauth-callback"))}&scope=${enc("atproto transition:generic")}`
      : abs("client-metadata.json"),
    client_name: "Skylights",
    client_uri: ORIGIN,
    logo_uri: abs("logo.png"),
    tos_uri: abs("tos"),
    policy_uri: abs("policy"),
    redirect_uris: [abs("atproto-oauth-callback")],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    application_type: "web",
    scope: "atproto transition:generic",
    token_endpoint_auth_method: "none",
    // token_endpoint_auth_method: "private_key_jwt",
    // token_endpoint_auth_signing_alg: "RS256",
    dpop_bound_access_tokens: true,
    // jwks_uri: abs("/jwks.json"),
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
    del: () => authStateCookie.delete(),
  },

  sessionStore: {
    set: (sub, session) => sessionCookie.create({ sub, session }),
    async get(sub) {
      const payload = await sessionCookie.get();
      if (payload?.sub == sub) {
        return payload.session;
      }
    },
    del: () => sessionCookie.delete(),
  },
});

// // Whenever needed, restore a user's session
// async function worker() {
//   const userDid = "did:plc:123";

//   const oauthSession = await client.restore(userDid);

//   // Note: If the current access_token is expired, the session will automatically
//   // (and transparently) refresh it. The new token set will be saved though
//   // the client's session store.

//   const agent = new Agent(oauthSession);

//   // Make Authenticated API calls
//   const profile = await agent.getProfile({ actor: agent.did });
//   console.log("Bsky profile:", profile.data);
// }

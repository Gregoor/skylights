import "server-only";

import { EncryptJWT, jwtDecrypt, JWTPayload } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.SESSION_SECRET!.slice(0, 256);
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt<Payload extends JWTPayload>(payload: Payload) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ enc: "A128CBC-HS256", alg: "dir" })
    .setIssuedAt()
    .setExpirationTime(payload.exp ?? "4w")
    .encrypt(encodedKey);
}

export async function decrypt<Payload>(session?: string) {
  try {
    if (!session) return null;
    const { payload } = await jwtDecrypt<Payload>(session, encodedKey);
    return payload;
  } catch (error) {
    console.error("Failed to verify session", error);
    return null;
  }
}

export class EncryptedCookie<D extends Omit<JWTPayload, "exp">> {
  constructor(public readonly key: string) {}

  async create(data: D & { expires?: Date }) {
    const session = await encrypt(data);
    (await cookies()).set(this.key, session, {
      httpOnly: true,
      secure: true,
      expires: data.expires,
      sameSite: "lax",
    });
  }

  async update() {
    const session = (await cookies()).get(this.key)?.value;
    const payload = await decrypt(session);

    if (!session || !payload) {
      return;
    }

    const cookieStore = await cookies();
    cookieStore.set(this.key, session, {
      httpOnly: true,
      secure: true,
      expires: payload.exp,
      sameSite: "lax",
    });
  }

  async get(): Promise<D | undefined> {
    const cookie = (await cookies()).get(this.key);
    if (!cookie) return;
    const value = await decrypt(cookie?.value);
    return value as D | undefined;
  }

  async delete() {
    (await cookies()).delete(this.key);
  }
}

import "server-only";

import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

const getExpiryFromNow = () =>
  new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000);

export async function encrypt<Payload extends JWTPayload>(payload: Payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("4w")
    .sign(encodedKey);
}

export async function decrypt<Payload>(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify<Payload>(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    console.error("Failed to verify session", error);
  }
}

export class EncryptedCookie<D extends JWTPayload> {
  constructor(public readonly key: string) {}

  async create(data: D) {
    const session = await encrypt(data);
    (await cookies()).set(this.key, session, {
      httpOnly: true,
      secure: true,
      expires: getExpiryFromNow(),
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
      expires: getExpiryFromNow(),
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

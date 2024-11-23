import "server-only";
import { JWTPayload, SignJWT, jwtVerify } from "jose";
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
    console.log("Failed to verify session", error);
  }
}

export class EncryptedCookie<D> {
  constructor(public readonly key: string) {}

  async create(data: D) {
    const expiresAt = getExpiryFromNow();
    const session = await encrypt({ expiresAt, data });
    (await cookies()).set(this.key, session, {
      httpOnly: true,
      secure: true,
      expires: expiresAt,
      sameSite: "lax",
      path: "/",
    });
  }

  async update() {
    const session = (await cookies()).get(this.key)?.value;
    const payload = await decrypt(session);

    if (!session || !payload) {
      return null;
    }

    const cookieStore = await cookies();
    cookieStore.set(this.key, session, {
      httpOnly: true,
      secure: true,
      expires: getExpiryFromNow(),
      sameSite: "lax",
      path: "/",
    });
  }

  async get(): Promise<D | undefined> {
    const value = await decrypt((await cookies()).get(this.key)?.value);
    return value?.data as D;
  }

  async delete() {
    (await cookies()).delete(this.key);
  }
}

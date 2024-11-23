import { NextResponse } from "next/server";
import { authClient } from "@/auth";

export const GET = () => NextResponse.json(authClient.jwks);

import { NextResponse } from "next/server";
import { authorSessionCookie } from "@/lib/author-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(authorSessionCookie, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return response;
}

import "server-only";
import { NextResponse } from "next/server";
export function jsonError(message: string, status = 400) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
export function sameOrigin(request: Request) {
  const expected = process.env.NEXT_PUBLIC_APP_URL;
  if (!expected) return false;
  try {
    return request.headers.get("origin") === new URL(expected).origin;
  } catch {
    return false;
  }
}

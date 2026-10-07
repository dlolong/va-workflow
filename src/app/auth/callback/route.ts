import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { safeNext } from "@/lib/domain.mjs";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const db = await serverSupabase();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(
          safeNext(url.searchParams.get("next")),
          process.env.NEXT_PUBLIC_APP_URL || url.origin,
        ),
      );
  }
  return NextResponse.redirect(
    new URL("/auth/error", process.env.NEXT_PUBLIC_APP_URL || url.origin),
  );
}

import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { serverSupabase } from "@/lib/supabase/server";
import { safeNext } from "@/lib/domain.mjs";
export async function GET(request: Request) {
  const u = new URL(request.url);
  const token = u.searchParams.get("token_hash");
  const type = u.searchParams.get("type");
  const origin = process.env.NEXT_PUBLIC_APP_URL || u.origin;
  if (
    token &&
    type &&
    ["email", "signup", "recovery", "invite", "magiclink", "email_change"].includes(type)
  ) {
    const db = await serverSupabase();
    const { error } = await db.auth.verifyOtp({ token_hash: token, type: type as EmailOtpType });
    if (!error)
      return NextResponse.redirect(
        new URL(
          type === "recovery" ? "/reset-password" : safeNext(u.searchParams.get("next")),
          origin,
        ),
      );
  }
  return NextResponse.redirect(new URL("/auth/error", origin));
}

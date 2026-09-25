import { NextRequest, NextResponse } from "next/server";
import { unsubscribeEmail, verifyUnsubscribeToken } from "@/lib/unsubscribe";

// RFC 8058 one-click unsubscribe target (List-Unsubscribe-Post). Mail
// providers POST "List-Unsubscribe=One-Click" to the header URL.
export async function POST(request: NextRequest) {
  const s = request.nextUrl.searchParams.get("s");
  const t = request.nextUrl.searchParams.get("t");
  if (!verifyUnsubscribeToken(s, t)) {
    return new NextResponse(null, { status: 400 });
  }
  try {
    await unsubscribeEmail(s);
    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error("One-click unsubscribe error:", err);
    return new NextResponse(null, { status: 500 });
  }
}

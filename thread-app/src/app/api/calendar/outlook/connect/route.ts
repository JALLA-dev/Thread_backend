import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    
    const clientId = formData.get("clientId") as string;
    const clientSecret = formData.get("clientSecret") as string;
    const tenantId = (formData.get("tenantId") as string) || "common";
    const redirectUri = formData.get("redirectUri") as string;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect(new URL("/dashboard/calendar?error=Missing_credentials", request.url));
    }

    // Save the custom credentials in a secure HTTP-only cookie
    // The callback route will read this cookie to complete the token exchange.
    const cookieStore = await cookies();
    cookieStore.set({
      name: "ms_oauth_config",
      value: JSON.stringify({ clientId, clientSecret, tenantId, redirectUri }),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 15, // 15 minutes to complete the flow
      path: "/",
    });

    // Use user ID as state to prevent CSRF and keep track of who is connecting
    const state = user.id;

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      response_mode: "query",
      scope: "User.Read Calendars.ReadWrite offline_access",
      state: state,
      prompt: "consent",
    });

    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;

    return NextResponse.redirect(url, { status: 303 });
  } catch (error) {
    console.error("Connect route error:", error);
    return NextResponse.redirect(new URL("/dashboard/calendar?error=Connection_initiation_failed", request.url));
  }
}

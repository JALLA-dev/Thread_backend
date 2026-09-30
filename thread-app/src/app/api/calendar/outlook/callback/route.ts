import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { calendarConnections } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // Contains the user ID
  const error = url.searchParams.get("error");
  const error_description = url.searchParams.get("error_description");

  // App base URL for redirects
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const returnUrl = "/dashboard/calendar"; // Always return to Calendar

  // Redirect to calendar with error if OAuth failed
  if (error) {
    let errorMsg = error_description || error;
    if (error === "access_denied") {
      errorMsg = "Outlook connection was cancelled.";
    }
    return NextResponse.redirect(
      new URL(`${returnUrl}?error=${encodeURIComponent(errorMsg)}`, appUrl)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`${returnUrl}?error=Invalid_OAuth_callback`, appUrl)
    );
  }

  // Verify user is still authenticated and matches the state
  const user = await getCurrentUser();
  if (!user || user.id !== state) {
    return NextResponse.redirect(
      new URL(`${returnUrl}?error=Unauthorized_or_state_mismatch`, appUrl)
    );
  }

  // Retrieve custom credentials from cookie
  const cookieStore = await cookies();
  const configCookie = cookieStore.get("ms_oauth_config");

  if (!configCookie) {
    return NextResponse.redirect(
      new URL(`${returnUrl}?error=Configuration_missing_or_expired`, appUrl)
    );
  }

  let config;
  try {
    config = JSON.parse(configCookie.value);
  } catch (e) {
    return NextResponse.redirect(
      new URL(`${returnUrl}?error=Configuration_invalid`, appUrl)
    );
  }

  const { clientId, clientSecret, tenantId, redirectUri } = config;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL(`${returnUrl}?error=Server_Configuration_Missing`, appUrl)
    );
  }

  try {
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokenData);
      return NextResponse.redirect(
        new URL(`${returnUrl}?error=${encodeURIComponent(tokenData.error_description || "Token_exchange_failed")}`, appUrl)
      );
    }

    // Get user info from Microsoft Graph
    const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const graphUser = await userResponse.json();
    
    if (!userResponse.ok) {
      console.error("Graph user fetch failed:", graphUser);
      return NextResponse.redirect(
        new URL(`${returnUrl}?error=Graph_fetch_failed`, appUrl)
      );
    }

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Save to database securely. We'll manually check and update or insert to avoid conflict constraint issues.
    const existing = await db
      .select()
      .from(calendarConnections)
      .where(and(eq(calendarConnections.userId, user.id), eq(calendarConnections.provider, "microsoft")))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(calendarConnections)
        .set({
          externalUserId: graphUser.id,
          email: graphUser.mail || graphUser.userPrincipalName,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || existing[0].refreshToken, // Keep existing if not returned
          expiresAt: expiresAt,
          isActive: true,
          clientId: clientId,
          clientSecret: clientSecret,
          tenantId: tenantId,
          updatedAt: new Date(),
        })
        .where(eq(calendarConnections.id, existing[0].id));
    } else {
      await db
        .insert(calendarConnections)
        .values({
          userId: user.id,
          provider: "microsoft",
          externalUserId: graphUser.id,
          email: graphUser.mail || graphUser.userPrincipalName,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: expiresAt,
          isActive: true,
          clientId: clientId,
          clientSecret: clientSecret,
          tenantId: tenantId,
        });
    }

    // Clear the config cookie after successful connection
    cookieStore.delete("ms_oauth_config");

    return NextResponse.redirect(new URL(`${returnUrl}?success=outlook_connected`, appUrl));
  } catch (err) {
    console.error("OAuth error:", err);
    return NextResponse.redirect(new URL(`${returnUrl}?error=Internal_server_error`, appUrl));
  }
}

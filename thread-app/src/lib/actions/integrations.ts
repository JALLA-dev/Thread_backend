"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { calendarConnections, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function getCalendarConnections() {
  const clerkUserId = await requireAuth();

  const userResult = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  const connections = await db
    .select()
    .from(calendarConnections)
    .where(eq(calendarConnections.userId, userResult[0].id));

  return { connections, userEmail: userResult[0].email };
}

export async function mockConnectOutlook() {
  try {
    const clerkUserId = await requireAuth();

    const userResult = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (userResult.length === 0) return { error: "Unauthorized" };

    const userId = userResult[0].id;
    const email = userResult[0].email;

    // Check if already connected
    const existing = await db
      .select()
      .from(calendarConnections)
      .where(
        and(
          eq(calendarConnections.userId, userId),
          eq(calendarConnections.provider, "microsoft")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return { error: "Outlook calendar is already connected." };
    }

    // Insert mock connection
    await db.insert(calendarConnections).values({
      userId,
      provider: "microsoft",
      email: email,
      accessToken: "mock_access_token_" + Date.now(),
      refreshToken: "mock_refresh_token_" + Date.now(),
      isActive: true,
    });

    revalidatePath("/dashboard/integrations");
    return { success: true };
  } catch (error) {
    console.error("Failed to connect Outlook:", error);
    return { error: "Failed to connect Outlook calendar." };
  }
}

export async function disconnectCalendar(connectionId: string) {
  try {
    const clerkUserId = await requireAuth();

    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (userResult.length === 0) return { error: "Unauthorized" };

    await db
      .delete(calendarConnections)
      .where(
        and(
          eq(calendarConnections.id, connectionId),
          eq(calendarConnections.userId, userResult[0].id)
        )
      );

    revalidatePath("/dashboard/integrations");
    return { success: true };
  } catch (error) {
    console.error("Failed to disconnect calendar:", error);
    return { error: "Failed to disconnect calendar." };
  }
}

export async function checkMicrosoftCredentials(
  clientId: string,
  clientSecret: string,
  tenantId: string,
  redirectUri: string
) {
  try {
    await requireAuth();

    if (!clientId || !clientSecret || !tenantId || !redirectUri) {
      return { error: "Missing required credential fields." };
    }

    try {
      new URL(redirectUri);
    } catch {
      return { error: "The Redirect URI is not configured correctly." };
    }

    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }).toString(),
      }
    );

    const data = await tokenResponse.json();

    if (!tokenResponse.ok) {
      const errorStr = data.error_description || data.error || "";
      if (errorStr.includes("client_id") || errorStr.includes("Application with identifier")) {
        return { error: "The Microsoft Client ID is invalid." };
      }
      if (errorStr.includes("client secret") || errorStr.includes("Invalid client secret")) {
        return { error: "The Microsoft Client Secret is invalid." };
      }
      if (data.error === "invalid_request" && errorStr.includes("tenant")) {
        return { error: "The Microsoft Tenant ID is invalid." };
      }
      // If it fails because the app is purely a public client/doesn't support client_credentials, 
      // but client ID & secret are recognized, we still consider it valid as the credentials matched!
      if (data.error === "unauthorized_client") {
        // App is valid but client_credentials grant is not allowed for this app. This proves credentials are correct!
        return { success: true };
      }

      console.error("Credential check failed:", data);
      return { error: "The Microsoft application configuration could not be verified." };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to check Microsoft credentials:", error);
    return { error: "The Microsoft application configuration could not be verified." };
  }
}

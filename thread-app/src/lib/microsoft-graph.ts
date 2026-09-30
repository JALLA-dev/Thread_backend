import { db } from "@/db";
import { calendarConnections } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getValidAccessToken(connectionId: string): Promise<string | null> {
  const connections = await db
    .select()
    .from(calendarConnections)
    .where(eq(calendarConnections.id, connectionId))
    .limit(1);

  if (connections.length === 0) return null;

  const connection = connections[0];
  
  if (!connection.isActive) return null;

  // Check if token is expired (adding 1 minute buffer)
  const isExpired = connection.expiresAt && new Date() > new Date(connection.expiresAt.getTime() - 60000);

  if (!isExpired) {
    return connection.accessToken;
  }

  // Token is expired, need to refresh
  if (!connection.refreshToken) {
    // If no refresh token, mark as inactive
    await db
      .update(calendarConnections)
      .set({ isActive: false })
      .where(eq(calendarConnections.id, connectionId));
    return null;
  }

  const tenantId = connection.tenantId || process.env.MICROSOFT_TENANT_ID || "common";
  const clientId = connection.clientId || process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = connection.clientSecret || process.env.MICROSOFT_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  try {
    const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed to refresh Microsoft token:", data);
      await db
        .update(calendarConnections)
        .set({ isActive: false })
        .where(eq(calendarConnections.id, connectionId));
      return null;
    }

    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    await db
      .update(calendarConnections)
      .set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || connection.refreshToken, // keep old if new isn't provided
        expiresAt: expiresAt,
        updatedAt: new Date(),
        isActive: true,
      })
      .where(eq(calendarConnections.id, connectionId));

    return data.access_token;
  } catch (err) {
    console.error("Error refreshing token:", err);
    return null;
  }
}

export async function getCalendarEvents(connectionId: string, startTime: string, endTime: string) {
  const token = await getValidAccessToken(connectionId);
  if (!token) throw new Error("Invalid or expired connection");

  // Format ISO strings to remove milliseconds and 'Z', Graph prefers standard ISO 8601 without strict UTC 'Z' for CalendarView when using timezone headers, but CalendarView works well with standard ISO
  const url = new URL("https://graph.microsoft.com/v1.0/me/calendarview");
  url.searchParams.append("startDateTime", startTime);
  url.searchParams.append("endDateTime", endTime);
  url.searchParams.append("$select", "subject,start,end,isAllDay,showAs");
  url.searchParams.append("$top", "1000"); // Max page size for calendarview

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Prefer: 'outlook.timezone="UTC"',
    },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Graph API error: ${err.error?.message || "Unknown error"}`);
  }

  const data = await response.json();
  return data.value;
}

export async function createCalendarEvent(connectionId: string, eventDetails: any) {
  const token = await getValidAccessToken(connectionId);
  if (!token) throw new Error("Invalid or expired connection");

  const response = await fetch("https://graph.microsoft.com/v1.0/me/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventDetails),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Graph API error: ${err.error?.message || "Failed to create event"}`);
  }

  return await response.json();
}

export async function updateCalendarEvent(connectionId: string, eventId: string, eventDetails: any) {
  const token = await getValidAccessToken(connectionId);
  if (!token) throw new Error("Invalid or expired connection");

  const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventDetails),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Graph API error: ${err.error?.message || "Failed to update event"}`);
  }

  return await response.json();
}

export async function deleteCalendarEvent(connectionId: string, eventId: string) {
  const token = await getValidAccessToken(connectionId);
  if (!token) throw new Error("Invalid or expired connection");

  const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const err = await response.json();
    throw new Error(`Graph API error: ${err.error?.message || "Failed to delete event"}`);
  }

  return true;
}

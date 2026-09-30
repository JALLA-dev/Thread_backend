"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { eventTypes, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function createEventType(formData: FormData) {
  try {
    const clerkUserId = await requireAuth();

    // Get the internal user ID
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (userResult.length === 0) {
      return { error: "User not found in database." };
    }

    const userId = userResult[0].id;
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || null;
    const slug = formData.get("slug") as string;
    const durationMinutes = parseInt(formData.get("duration") as string, 10);
    const requiresApproval = formData.get("requiresApproval") === "on";
    const teamIdStr = formData.get("teamId") as string;
    const teamId = teamIdStr ? teamIdStr : null;
    const routingStrategy = (formData.get("routingStrategy") as any) || "fixed";

    if (!title || !slug || !durationMinutes || isNaN(durationMinutes)) {
      return { error: "Title, slug, and a valid duration are required." };
    }

    // Check if slug is unique for this user or team
    // If it's a team event, slug should be unique within the team.
    // However, the schema constraint uniqueIndex("event_types_user_slug_idx").on(table.userId, table.slug)
    // applies to personal slug uniqueness. If we want it unique to team, we'd need a different check, 
    // but right now it's owned by userId.
    const existingSlug = await db
      .select({ id: eventTypes.id })
      .from(eventTypes)
      .where(and(eq(eventTypes.userId, userId), eq(eventTypes.slug, slug)))
      .limit(1);

    if (existingSlug.length > 0) {
      return { error: "An event type with this URL slug already exists." };
    }

    await db.insert(eventTypes).values({
      userId,
      teamId,
      title,
      description,
      slug,
      durationMinutes,
      requiresApproval,
      routingStrategy: teamId ? routingStrategy : "fixed",
      isActive: true,
    });

    revalidatePath("/dashboard/event-types");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to create event type:", error);
    return { error: "Failed to create event type. Please try again." };
  }
}

export async function toggleEventTypeStatus(id: string, isActive: boolean) {
  try {
    const clerkUserId = await requireAuth();

    // First ensure the user owns this event type
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (userResult.length === 0) return { error: "Unauthorized" };

    const result = await db
      .update(eventTypes)
      .set({ isActive, updatedAt: new Date() })
      .where(
        and(eq(eventTypes.id, id), eq(eventTypes.userId, userResult[0].id))
      )
      .returning();

    if (result.length === 0) {
      return { error: "Event type not found or unauthorized." };
    }

    revalidatePath("/dashboard/event-types");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle status:", error);
    return { error: "Failed to update status." };
  }
}

export async function deleteEventType(id: string) {
  try {
    const clerkUserId = await requireAuth();

    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (userResult.length === 0) return { error: "Unauthorized" };

    const result = await db
      .delete(eventTypes)
      .where(
        and(eq(eventTypes.id, id), eq(eventTypes.userId, userResult[0].id))
      )
      .returning();

    if (result.length === 0) {
      return { error: "Event type not found or unauthorized." };
    }

    revalidatePath("/dashboard/event-types");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete event type:", error);
    return { error: "Failed to delete event type." };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { availabilityRules, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export async function getOrCreateAvailability() {
  const clerkUserId = await requireAuth();

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }
  const userId = userResult[0].id;

  const rules = await db
    .select()
    .from(availabilityRules)
    .where(eq(availabilityRules.userId, userId))
    .orderBy(availabilityRules.dayOfWeek); // DB enum ordering might differ, we sort client side

  // If they have rules, just return them
  if (rules.length > 0) {
    return rules;
  }

  // Otherwise, create default rules (Mon-Fri 9:00 to 17:00)
  const newRules = DAYS_OF_WEEK.map((day) => ({
    userId,
    dayOfWeek: day,
    isEnabled: !["saturday", "sunday"].includes(day),
    startTime: "09:00",
    endTime: "17:00",
  }));

  await db.insert(availabilityRules).values(newRules);

  const createdRules = await db
    .select()
    .from(availabilityRules)
    .where(eq(availabilityRules.userId, userId));

  return createdRules;
}

export async function updateAvailabilityRule(
  ruleId: string,
  isEnabled: boolean,
  startTime: string,
  endTime: string
) {
  try {
    const clerkUserId = await requireAuth();

    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (userResult.length === 0) return { error: "Unauthorized" };

    await db
      .update(availabilityRules)
      .set({
        isEnabled,
        startTime,
        endTime,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(availabilityRules.id, ruleId),
          eq(availabilityRules.userId, userResult[0].id)
        )
      );

    revalidatePath("/dashboard/availability");
    return { success: true };
  } catch (error) {
    console.error("Failed to update rule:", error);
    return { error: "Failed to update availability" };
  }
}

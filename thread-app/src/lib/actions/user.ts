"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function updateProfile(formData: FormData) {
  try {
    const clerkUserId = await requireAuth();

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const timeZone = formData.get("timeZone") as string;

    if (!firstName || !timeZone) {
      return { error: "First name and Time Zone are required." };
    }

    await db
      .update(users)
      .set({
        firstName,
        lastName: lastName || null,
        timeZone,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkUserId, clerkUserId));

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return { error: "Failed to update profile. Please try again." };
  }
}

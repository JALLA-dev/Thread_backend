"use server";

import { db } from "@/db";
import { waitlistEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function removeWaitlistEntry(id: string) {
  await db
    .update(waitlistEntries)
    .set({ isActive: false })
    .where(eq(waitlistEntries.id, id));

  revalidatePath("/dashboard/waitlist");
  return { success: true };
}

export async function promoteWaitlistEntry(id: string) {
  // In a real app, this would trigger an email to the guest telling them a spot opened up,
  // or automatically create a pending booking.
  // For now, we just mark it as promoted.
  
  await db
    .update(waitlistEntries)
    .set({ 
      isActive: false,
      promotedAt: new Date()
    })
    .where(eq(waitlistEntries.id, id));

  revalidatePath("/dashboard/waitlist");
  return { success: true };
}

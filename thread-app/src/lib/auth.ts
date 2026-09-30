import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get or create the current authenticated user in the database.
 * Uses Clerk userId as the primary identifier.
 * Returns null if the user is not authenticated.
 */
export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Try to find the user in our database
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, userId))
    .limit(1);

  if (existingUsers.length > 0) {
    return existingUsers[0];
  }

  // User not in DB yet — sync from Clerk
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const primaryEmail = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  );

  const newUser = await db
    .insert(users)
    .values({
      clerkUserId: userId,
      email: primaryEmail?.emailAddress ?? "",
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      username:
        clerkUser.username ??
        primaryEmail?.emailAddress.split("@")[0] ??
        undefined,
      imageUrl: clerkUser.imageUrl,
    })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: {
        email: primaryEmail?.emailAddress ?? "",
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        updatedAt: new Date(),
      },
    })
    .returning();

  return newUser[0] ?? null;
}

/**
 * Get the current user's Clerk userId without DB lookup.
 * Throws if not authenticated.
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

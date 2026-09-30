"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { teams, teamMembers, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function getTeams() {
  const clerkUserId = await requireAuth();

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (userResult.length === 0) throw new Error("User not found");
  const userId = userResult[0].id;

  // Get teams where user is a member
  const userTeams = await db
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      imageUrl: teams.imageUrl,
      role: teamMembers.role,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, userId));

  return userTeams;
}

export async function createTeam(formData: FormData) {
  try {
    const clerkUserId = await requireAuth();

    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (userResult.length === 0) return { error: "Unauthorized" };
    const userId = userResult[0].id;

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;

    if (!name || !slug) return { error: "Name and slug are required" };

    // Check slug uniqueness
    const existing = await db.select({ id: teams.id }).from(teams).where(eq(teams.slug, slug)).limit(1);
    if (existing.length > 0) return { error: "Team slug is already taken" };

    // Insert team
    const newTeam = await db.insert(teams).values({
      name,
      slug,
      ownerUserId: userId,
    }).returning();

    // Make creator the owner
    await db.insert(teamMembers).values({
      teamId: newTeam[0].id,
      userId: userId,
      role: "owner",
    });

    revalidatePath("/dashboard/teams");
    return { success: true, teamId: newTeam[0].id };
  } catch (error) {
    console.error("Failed to create team:", error);
    return { error: "Failed to create team" };
  }
}

export async function getTeamDetails(teamId: string) {
  const clerkUserId = await requireAuth();

  const userResult = await db.select({ id: users.id }).from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  if (userResult.length === 0) throw new Error("Unauthorized");
  
  // Verify membership
  const memberCheck = await db.select().from(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userResult[0].id))).limit(1);
  if (memberCheck.length === 0) throw new Error("Unauthorized");

  const teamList = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  if (teamList.length === 0) throw new Error("Team not found");

  const members = await db
    .select({
      id: teamMembers.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      role: teamMembers.role,
      joinedAt: teamMembers.joinedAt,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamId))
    .orderBy(teamMembers.joinedAt);

  return { team: teamList[0], members };
}

export async function addTeamMember(teamId: string, email: string) {
  try {
    const clerkUserId = await requireAuth();

    const userResult = await db.select({ id: users.id }).from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (userResult.length === 0) return { error: "Unauthorized" };

    // Verify user is owner or admin of this team
    const memberCheck = await db.select().from(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userResult[0].id))).limit(1);
    if (memberCheck.length === 0 || (memberCheck[0].role !== "owner" && memberCheck[0].role !== "admin")) {
      return { error: "You do not have permission to add members to this team" };
    }

    // Find the target user by email
    const targetUserList = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (targetUserList.length === 0) {
      return { error: "No user found with this email. They must sign up for Thread first." };
    }

    const targetUserId = targetUserList[0].id;

    // Check if already in team
    const existingMember = await db.select().from(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, targetUserId))).limit(1);
    if (existingMember.length > 0) {
      return { error: "User is already a member of this team" };
    }

    await db.insert(teamMembers).values({
      teamId,
      userId: targetUserId,
      role: "member",
    });

    revalidatePath(`/dashboard/teams/${teamId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to add team member:", error);
    return { error: "Failed to add team member" };
  }
}

export async function removeTeamMember(teamId: string, memberId: string) {
  try {
    const clerkUserId = await requireAuth();

    const userResult = await db.select({ id: users.id }).from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    if (userResult.length === 0) return { error: "Unauthorized" };

    // Verify user is owner/admin
    const memberCheck = await db.select().from(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userResult[0].id))).limit(1);
    if (memberCheck.length === 0 || (memberCheck[0].role !== "owner" && memberCheck[0].role !== "admin")) {
      return { error: "You do not have permission to remove members" };
    }

    // Check if target member is the owner
    const targetMemberList = await db.select().from(teamMembers).where(eq(teamMembers.id, memberId)).limit(1);
    if (targetMemberList.length > 0 && targetMemberList[0].role === "owner") {
      return { error: "Cannot remove the team owner" };
    }

    await db.delete(teamMembers).where(eq(teamMembers.id, memberId));

    revalidatePath(`/dashboard/teams/${teamId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to remove team member:", error);
    return { error: "Failed to remove team member" };
  }
}

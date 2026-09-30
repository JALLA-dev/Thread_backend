import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  json,
  pgEnum,
  uuid,
  index,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
  "rescheduled",
  "completed",
  "no_show",
]);

export const memberRoleEnum = pgEnum("member_role", [
  "owner",
  "admin",
  "member",
]);

export const routingStrategyEnum = pgEnum("routing_strategy", [
  "round_robin",
  "fixed",
  "manual",
]);

export const dayOfWeekEnum = pgEnum("day_of_week", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "booking_confirmation",
  "booking_reminder",
  "booking_cancelled",
  "booking_rescheduled",
  "approval_request",
  "approval_result",
  "waitlist_promoted",
]);

export const auditActionEnum = pgEnum("audit_action", [
  "booking_created",
  "booking_confirmed",
  "booking_cancelled",
  "booking_rescheduled",
  "booking_approved",
  "booking_rejected",
  "event_type_created",
  "event_type_updated",
  "event_type_deleted",
  "calendar_connected",
  "calendar_disconnected",
  "team_member_added",
  "team_member_removed",
  "availability_updated",
  "profile_updated",
  "waitlist_promoted",
]);

// ─────────────────────────────────────────────
// Users (profile data linked to Clerk userId)
// ─────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    email: text("email").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    username: varchar("username", { length: 50 }).unique(),
    imageUrl: text("image_url"),
    timeZone: text("time_zone").notNull().default("UTC"),
    locale: text("locale").notNull().default("en"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("users_clerk_user_id_idx").on(table.clerkUserId),
    index("users_username_idx").on(table.username),
  ]
);

// ─────────────────────────────────────────────
// Event Types
// ─────────────────────────────────────────────

export const eventTypes = pgTable(
  "event_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    durationMinutes: integer("duration_minutes").notNull().default(30),
    isActive: boolean("is_active").notNull().default(true),
    requiresApproval: boolean("requires_approval").notNull().default(false),
    enableWaitlist: boolean("enable_waitlist").notNull().default(false),
    maxCapacity: integer("max_capacity").default(1),
    minimumNoticeMinutes: integer("minimum_notice_minutes").notNull().default(60),
    maximumFutureDays: integer("maximum_future_days").notNull().default(60),
    bufferBeforeMinutes: integer("buffer_before_minutes").notNull().default(0),
    bufferAfterMinutes: integer("buffer_after_minutes").notNull().default(0),
    routingStrategy: routingStrategyEnum("routing_strategy")
      .notNull()
      .default("fixed"),
    metadata: json("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("event_types_user_id_idx").on(table.userId),
    index("event_types_team_id_idx").on(table.teamId),
    uniqueIndex("event_types_user_slug_idx").on(table.userId, table.slug),
  ]
);

// ─────────────────────────────────────────────
// Availability
// ─────────────────────────────────────────────

export const availabilityRules = pgTable(
  "availability_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
    isEnabled: boolean("is_enabled").notNull().default(true),
    startTime: text("start_time").notNull().default("09:00"), // HH:MM
    endTime: text("end_time").notNull().default("17:00"),     // HH:MM
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("availability_rules_user_id_idx").on(table.userId)]
);

export const availabilityBreaks = pgTable(
  "availability_breaks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    availabilityRuleId: uuid("availability_rule_id")
      .notNull()
      .references(() => availabilityRules.id, { onDelete: "cascade" }),
    startTime: text("start_time").notNull(), // HH:MM
    endTime: text("end_time").notNull(),     // HH:MM
    label: text("label"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("availability_breaks_rule_id_idx").on(table.availabilityRuleId),
  ]
);

// ─────────────────────────────────────────────
// Calendar Connections (Outlook / Graph API)
// ─────────────────────────────────────────────

export const calendarConnections = pgTable(
  "calendar_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("microsoft"),
    externalUserId: text("external_user_id"),
    email: text("email"),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    calendarId: text("calendar_id"),
    clientId: text("client_id"),
    clientSecret: text("client_secret"),
    tenantId: text("tenant_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("calendar_connections_user_id_idx").on(table.userId),
    uniqueIndex("calendar_connections_user_provider_idx").on(
      table.userId,
      table.provider
    ),
  ]
);

// ─────────────────────────────────────────────
// Bookings
// ─────────────────────────────────────────────

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventTypeId: uuid("event_type_id")
      .notNull()
      .references(() => eventTypes.id, { onDelete: "restrict" }),
    hostUserId: uuid("host_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    assignedMemberId: uuid("assigned_member_id").references(() => users.id, {
      onDelete: "set null",
    }),
    guestName: text("guest_name").notNull(),
    guestEmail: text("guest_email").notNull(),
    guestPhone: text("guest_phone"),
    guestNotes: text("guest_notes"),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    timeZone: text("time_zone").notNull(),
    status: bookingStatusEnum("status").notNull().default("pending"),
    cancellationReason: text("cancellation_reason"),
    cancellationToken: text("cancellation_token").unique(),
    rescheduleToken: text("reschedule_token").unique(),
    calendarEventId: text("calendar_event_id"),
    conferenceLink: text("conference_link"),
    metadata: json("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("bookings_host_user_id_idx").on(table.hostUserId),
    index("bookings_event_type_id_idx").on(table.eventTypeId),
    index("bookings_start_time_idx").on(table.startTime),
    index("bookings_guest_email_idx").on(table.guestEmail),
    index("bookings_status_idx").on(table.status),
  ]
);

// ─────────────────────────────────────────────
// Waitlist
// ─────────────────────────────────────────────

export const waitlistEntries = pgTable(
  "waitlist_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventTypeId: uuid("event_type_id")
      .notNull()
      .references(() => eventTypes.id, { onDelete: "cascade" }),
    hostUserId: uuid("host_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    guestName: text("guest_name").notNull(),
    guestEmail: text("guest_email").notNull(),
    guestPhone: text("guest_phone"),
    preferredStartTime: timestamp("preferred_start_time", {
      withTimezone: true,
    }),
    promotedAt: timestamp("promoted_at", { withTimezone: true }),
    promotedBookingId: uuid("promoted_booking_id").references(
      () => bookings.id,
      { onDelete: "set null" }
    ),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("waitlist_entries_event_type_id_idx").on(table.eventTypeId),
    index("waitlist_entries_host_user_id_idx").on(table.hostUserId),
  ]
);

// ─────────────────────────────────────────────
// Teams
// ─────────────────────────────────────────────

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    description: text("description"),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("teams_owner_user_id_idx").on(table.ownerUserId)]
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("member"),
    isEligible: boolean("is_eligible").notNull().default(true),
    roundRobinOrder: integer("round_robin_order"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("team_members_team_id_idx").on(table.teamId),
    index("team_members_user_id_idx").on(table.userId),
    uniqueIndex("team_members_team_user_idx").on(table.teamId, table.userId),
  ]
);

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id").references(() => bookings.id, {
      onDelete: "cascade",
    }),
    type: notificationTypeEnum("type").notNull(),
    recipientEmail: text("recipient_email").notNull(),
    subject: text("subject").notNull(),
    body: text("body"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
    retryCount: integer("retry_count").notNull().default(0),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_booking_id_idx").on(table.bookingId),
    index("notifications_recipient_email_idx").on(table.recipientEmail),
    index("notifications_scheduled_for_idx").on(table.scheduledFor),
  ]
);

// ─────────────────────────────────────────────
// Audit Logs
// ─────────────────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: auditActionEnum("action").notNull(),
    targetType: text("target_type"), // "booking", "event_type", etc.
    targetId: uuid("target_id"),
    metadata: json("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_logs_actor_user_id_idx").on(table.actorUserId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_target_idx").on(table.targetType, table.targetId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ]
);

// ─────────────────────────────────────────────
// Relations
// ─────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  eventTypes: many(eventTypes),
  availabilityRules: many(availabilityRules),
  calendarConnections: many(calendarConnections),
  hostBookings: many(bookings, { relationName: "host" }),
  teamMemberships: many(teamMembers),
  ownedTeams: many(teams),
  auditLogs: many(auditLogs),
}));

export const eventTypesRelations = relations(eventTypes, ({ one, many }) => ({
  user: one(users, {
    fields: [eventTypes.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [eventTypes.teamId],
    references: [teams.id],
  }),
  bookings: many(bookings),
  waitlistEntries: many(waitlistEntries),
}));

export const availabilityRulesRelations = relations(
  availabilityRules,
  ({ one, many }) => ({
    user: one(users, {
      fields: [availabilityRules.userId],
      references: [users.id],
    }),
    breaks: many(availabilityBreaks),
  })
);

export const availabilityBreaksRelations = relations(
  availabilityBreaks,
  ({ one }) => ({
    availabilityRule: one(availabilityRules, {
      fields: [availabilityBreaks.availabilityRuleId],
      references: [availabilityRules.id],
    }),
  })
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  eventType: one(eventTypes, {
    fields: [bookings.eventTypeId],
    references: [eventTypes.id],
  }),
  host: one(users, {
    fields: [bookings.hostUserId],
    references: [users.id],
    relationName: "host",
  }),
  assignedMember: one(users, {
    fields: [bookings.assignedMemberId],
    references: [users.id],
    relationName: "assignedMember",
  }),
  notifications: many(notifications),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, {
    fields: [teams.ownerUserId],
    references: [users.id],
  }),
  members: many(teamMembers),
  eventTypes: many(eventTypes),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  booking: one(bookings, {
    fields: [notifications.bookingId],
    references: [bookings.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorUserId],
    references: [users.id],
  }),
}));

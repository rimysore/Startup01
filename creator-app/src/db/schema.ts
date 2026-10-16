import { index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatar: text("avatar"),
  /** free | pro | creator — kept in sync with the active subscription by the billing webhook. */
  plan: text("plan").notNull().default("free"),
  planRenewsAt: timestamp("plan_renews_at", { withTimezone: true }),
  /** 1-100 for the founding creators (first to connect a channel); null for everyone else. */
  founderNumber: integer("founder_number").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  /** SHA-256 of the session token; the raw token only ever lives in the user's cookie. */
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const youtubeConnections = pgTable("youtube_connections", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  channelId: text("channel_id"),
  channelTitle: text("channel_title"),
  /** AES-256-GCM encrypted with SESSION_SECRET. */
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  /** Set when Google rejects the refresh token (user revoked access, or it expired). Cleared on reconnect. */
  needsReconnectAt: timestamp("needs_reconnect_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  /** Razorpay subscription id (sub_...). */
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull(),
  /** Razorpay status: created | authenticated | active | pending | halted | cancelled | completed | expired */
  status: text("status").notNull(),
  currentEnd: timestamp("current_end", { withTimezone: true }),
  cancelAtCycleEnd: integer("cancel_at_cycle_end").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usage = pgTable(
  "usage",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    month: text("month").notNull(), // YYYY-MM (UTC)
    credits: integer("credits").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.month] })],
);

/** Razorpay webhook event ids we've already processed, so retries are idempotent. */
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One row per real model call: what it cost and how long it took. No prompt or answer content is stored. */
export const aiCalls = pgTable(
  "ai_calls",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    feature: text("feature").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
    cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
    /** Estimated cost in millionths of a US dollar. */
    costMicros: integer("cost_micros").notNull(),
    latencyMs: integer("latency_ms").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ai_calls_user_time").on(t.userId, t.createdAt), index("ai_calls_time").on(t.createdAt)],
);

/** Recent AI answers, so asking the same thing twice doesn't pay for (or charge credits for) a second call. */
export const aiCache = pgTable(
  "ai_cache",
  {
    key: text("key").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    feature: text("feature").notNull(),
    result: jsonb("result").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("ai_cache_expires").on(t.expiresAt)],
);

/**
 * Recent YouTube API responses, encrypted, shared by every server instance. Saves YouTube quota and lets us show
 * the last good data when YouTube is down or our quota is used up. Deleted with the user or on disconnect.
 */
export const youtubeCache = pgTable(
  "youtube_cache",
  {
    key: text("key").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** AES-256-GCM encrypted JSON. */
    value: text("value").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
    /** Fresh until this time; after it we refetch, but keep the row as a fallback until keepUntil. */
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    keepUntil: timestamp("keep_until", { withTimezone: true }).notNull(),
  },
  (t) => [index("youtube_cache_user").on(t.userId), index("youtube_cache_keep").on(t.keepUntil)],
);

/** Channels a creator follows to compare against (max 5 each). */
export const competitors = pgTable(
  "competitors",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channelId: text("channel_id").notNull(),
    title: text("title").notNull(),
    handle: text("handle"),
    avatar: text("avatar"),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("competitors_user_channel").on(t.userId, t.channelId)],
);

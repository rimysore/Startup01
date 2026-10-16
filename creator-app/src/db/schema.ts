import { boolean, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

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
  /** Language Mitra writes in (reports, WhatsApp, answers). The dashboard keeps it in sync. */
  language: text("language").notNull().default("hinglish"),
  /** Monday report and the check two days after each upload. */
  notifyWeekly: boolean("notify_weekly").notNull().default(true),
  notifyVideoCheck: boolean("notify_video_check").notNull().default(true),
  /** Send reports by email when WhatsApp isn't connected. */
  notifyEmail: boolean("notify_email").notNull().default(true),
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
    /** Founder Pass uses this month (free features for founding creators; separate from credits). */
    founderUses: integer("founder_uses").notNull().default(0),
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

/** Creators found for outreach (admin tool). Public channel data only; emails only if the creator published them. */
export const prospects = pgTable(
  "prospects",
  {
    id: serial("id").primaryKey(),
    channelId: text("channel_id").notNull().unique(),
    title: text("title").notNull(),
    handle: text("handle"),
    avatar: text("avatar"),
    country: text("country"),
    language: text("language"),
    subscribers: integer("subscribers").notNull().default(0),
    views: text("views").notNull().default("0"), // can exceed int range
    videoCount: integer("video_count").notNull().default(0),
    lastUploadAt: timestamp("last_upload_at", { withTimezone: true }),
    latestVideoTitle: text("latest_video_title"),
    description: text("description"),
    emails: jsonb("emails").$type<string[]>().notNull().default([]),
    links: jsonb("links").$type<string[]>().notNull().default([]),
    score: integer("score").notNull().default(0),
    seed: text("seed").notNull(),
    subject: text("subject"),
    opener: text("opener"),
    /** new | approved | contacted | replied | joined | not_interested | do_not_contact */
    status: text("status").notNull().default("new"),
    notes: text("notes"),
    contactedAt: timestamp("contacted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("prospects_status").on(t.status), index("prospects_score").on(t.score)],
);

/** Each discovery run, so YouTube quota spent on prospecting stays inside its daily budget. */
export const prospectRuns = pgTable(
  "prospect_runs",
  {
    id: serial("id").primaryKey(),
    seed: text("seed").notNull(),
    language: text("language"),
    units: integer("units").notNull(),
    found: integer("found").notNull(),
    added: integer("added").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("prospect_runs_time").on(t.createdAt)],
);

/**
 * A creator's WhatsApp number. Linked only by the creator messaging Mitra a one-time code from that number, so
 * the number is proven and the message itself is the opt-in. `optedOutAt` is set by STOP and honoured everywhere.
 */
export const whatsappContacts = pgTable("whatsapp_contacts", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Digits only, with country code (WhatsApp's wa_id), e.g. 919876543210. */
  phone: text("phone").notNull().unique(),
  optedInAt: timestamp("opted_in_at", { withTimezone: true }).notNull().defaultNow(),
  optedOutAt: timestamp("opted_out_at", { withTimezone: true }),
  /** Last message from the creator: free-form replies are allowed for 24 hours after it. */
  lastInboundAt: timestamp("last_inbound_at", { withTimezone: true }),
  /** What the bot is waiting for (e.g. a topic for titles), with an expiry. */
  state: jsonb("state").$type<{ awaiting: string; until: number } | null>(),
});

/** One-time codes for linking WhatsApp ("JOIN 4821"), valid for 30 minutes. */
export const whatsappLinkCodes = pgTable("whatsapp_link_codes", {
  code: text("code").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/**
 * Every report sent (or attempted), one row per user + kind + key (ISO week for the Monday report, video id for
 * the 48-hour check). The unique key makes sending idempotent: a retried cron can never send twice. The
 * rendered report is kept so "Full report" can be answered without recomputing.
 */
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** weekly | video_check */
    kind: text("kind").notNull(),
    key: text("key").notNull(),
    /** whatsapp | email | none */
    channel: text("channel").notNull().default("none"),
    /** pending | sent | failed | skipped */
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("notifications_unique").on(t.userId, t.kind, t.key), index("notifications_status").on(t.status, t.createdAt)],
);

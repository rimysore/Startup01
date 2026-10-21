import { boolean, date, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

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
  /** When the creator picked their language (first sign-in asks once). */
  languageSetAt: timestamp("language_set_at", { withTimezone: true }),
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

/**
 * Early-access list while the beta is invite-only (Google lets an unverified app connect only test users you add
 * by hand). Admins invite people from the waitlist page; joining is matched by email.
 */
export const waitlist = pgTable(
  "waitlist",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name"),
    channel: text("channel"),
    language: text("language"),
    whatsapp: text("whatsapp"),
    /** waiting | invited */
    status: text("status").notNull().default("waiting"),
    source: text("source"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
  },
  (t) => [index("waitlist_status").on(t.status, t.createdAt)],
);

/**
 * The in-app interview: why a creator wants Mitra, what's hardest about growing, what they'd pay. One row per
 * creator (answering again replaces it). Read by admins on the Users page to decide what to build next.
 */
export const creatorInterviews = pgTable("creator_interviews", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  answers: jsonb("answers").$type<Record<string, string | string[]>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Beta product events (first-party, no third-party trackers): what creators used and when, and where they first
 * came from. Answers the beta's questions (cost per creator by channel, month-2/3 retention, repeat Video Doctor
 * use, language ratings, price survey). Deleted with the account. Creators can switch it off in Connections.
 */
export const betaEvents = pgTable(
  "beta_events",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    /** Random id kept in the browser, so visits before sign-in can be tied to the account that follows. */
    anonId: text("anon_id"),
    name: text("name").notNull(),
    props: jsonb("props").$type<Record<string, unknown>>().notNull().default({}),
    /** First-touch source (utm_source, referrer host or "direct"). */
    source: text("source"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("beta_events_user_time").on(t.userId, t.createdAt), index("beta_events_name_time").on(t.name, t.createdAt)],
);

/**
 * Retention Sprints: a creator committed to Video Doctor's fixes for a video. Their next uploads' average % viewed
 * is compared with the channel's average at the time (baselinePct) on the Progress page.
 */
export const sprints = pgTable(
  "sprints",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: text("video_id").notNull(),
    videoTitle: text("video_title").notNull(),
    fixes: jsonb("fixes").$type<string[]>().notNull().default([]),
    /** Channel average % viewed when the creator committed (null if YouTube had no data). */
    baselinePct: integer("baseline_pct_x10"),
    language: text("language"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sprints_user_video").on(t.userId, t.videoId)],
);

/* ------------------------------------------------------------------------------------------------------------------
 * Marketplace (phase 1): creators, businesses, brands and agencies; cross-platform creator profiles with
 * self-reported or verified numbers; opportunities; deals and what they produced. Everything is deleted with the
 * account. Docs: docs/MARKETPLACE.md.
 * ---------------------------------------------------------------------------------------------------------------- */

/** One row per person who joined the marketplace: which side they're on and the language of their screens. */
export const members = pgTable("members", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  /** creator | business | brand | agency */
  role: text("role").notNull(),
  /** en | kn: the language of the marketplace screens. */
  uiLanguage: text("ui_language").notNull().default("en"),
  /** Secret part of the member's offer-forwarding address (offers+<token>@…). Made on first use. */
  inboxToken: text("inbox_token").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A creator's profile and media kit. Public at /kit/<slug> only when `isPublic` is on. */
export const creatorProfiles = pgTable("creator_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  city: text("city").notNull().default("Bengaluru"),
  area: text("area"),
  niches: jsonb("niches").$type<string[]>().notNull().default([]),
  /** Language codes the creator makes content in (kn, en). */
  languages: jsonb("languages").$type<string[]>().notNull().default([]),
  /** The creator's own prices, in whole rupees: [{ deliverable: "reel", priceInr: 4000 }]. */
  rates: jsonb("rates").$type<{ deliverable: string; priceInr: number }[]>().notNull().default([]),
  contactEmail: text("contact_email"),
  /** Shared with a business only after the creator accepts its invite. */
  whatsapp: text("whatsapp"),
  isPublic: boolean("is_public").notNull().default(false),
  /** The creator agreed to be suggested to businesses' briefs (off until they switch it on). */
  openToOffers: boolean("open_to_offers").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * A creator's account on one platform. Numbers are self-reported until verified (`verifiedAt`), which today means
 * a connected YouTube channel; the media kit always shows which is which.
 */
export const creatorHandles = pgTable(
  "creator_handles",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** instagram | youtube | facebook | sharechat | moj | josh | other */
    platform: text("platform").notNull(),
    handle: text("handle").notNull(),
    followers: integer("followers"),
    avgViews: integer("avg_views"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    /** How it was verified, e.g. "youtube_connection". */
    verifiedBy: text("verified_by"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("creator_handles_user_platform").on(t.userId, t.platform)],
);

/** A local business (or brand/agency) profile: what it is, where, and what it can spend. */
export const businessProfiles = pgTable("business_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category"),
  city: text("city").notNull().default("Bengaluru"),
  area: text("area"),
  budgetMinInr: integer("budget_min_inr"),
  budgetMaxInr: integer("budget_max_inr"),
  website: text("website"),
  instagram: text("instagram"),
  /** Shared with a creator only after they accept an invite. */
  whatsapp: text("whatsapp"),
  /** Hash of the counter PIN staff type to redeem a customer's coupon (never stored in clear). */
  counterPinHash: text("counter_pin_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** What a business wants from creators (the brief). Matching and the CMO agent build on this in weeks 3-4. */
export const opportunities = pgTable(
  "opportunities",
  {
    id: text("id").primaryKey(),
    businessUserId: text("business_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    goal: text("goal").notNull(),
    brief: text("brief"),
    area: text("area"),
    niches: jsonb("niches").$type<string[]>().notNull().default([]),
    languages: jsonb("languages").$type<string[]>().notNull().default([]),
    deliverables: jsonb("deliverables").$type<string[]>().notNull().default([]),
    budgetInr: integer("budget_inr"),
    postBy: date("post_by"),
    /** Where a tracked link sends people: the business's site, map or WhatsApp link (https only). */
    destinationUrl: text("destination_url"),
    /** draft | open | closed */
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("opportunities_status").on(t.status, t.createdAt)],
);

/**
 * A deal as the creator logs it. `source` = "own" for offers the creator found themselves (Mitra never takes a fee
 * on those) or "mitra" for deals Mitra brought. The business side links in through `businessUserId` once both
 * sides are on Mitra; until then `counterparty` is just a name.
 */
export const deals = pgTable(
  "deals",
  {
    id: text("id").primaryKey(),
    creatorUserId: text("creator_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessUserId: text("business_user_id").references(() => users.id, { onDelete: "set null" }),
    opportunityId: text("opportunity_id").references(() => opportunities.id, { onDelete: "set null" }),
    source: text("source").notNull().default("own"),
    counterparty: text("counterparty").notNull(),
    /** whatsapp | instagram | email | phone | other */
    channel: text("channel"),
    offerText: text("offer_text"),
    deliverables: text("deliverables"),
    feeInr: integer("fee_inr"),
    barter: text("barter"),
    postBy: date("post_by"),
    paymentTerms: text("payment_terms"),
    usageTerms: text("usage_terms"),
    /** offered | negotiating | agreed | posted | paid | declined | cancelled */
    status: text("status").notNull().default("offered"),
    /** The offer checker's result when the offer was saved. */
    checks: jsonb("checks").$type<{ term: string; state: string; text: string }[]>().notNull().default([]),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("deals_creator_time").on(t.creatorUserId, t.createdAt)],
);

/** What a deal produced: the promo code or link that measures it, customers, payment and both sides' ratings. */
export const dealOutcomes = pgTable("deal_outcomes", {
  dealId: text("deal_id")
    .primaryKey()
    .references(() => deals.id, { onDelete: "cascade" }),
  promoCode: text("promo_code"),
  trackedLink: text("tracked_link"),
  redemptions: integer("redemptions"),
  paidInr: integer("paid_inr"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  /** Short code for the tracked link /r/<linkCode> (deals Mitra brought). */
  linkCode: text("link_code").unique(),
  /** Visits through the tracked link. */
  clicks: integer("clicks").notNull().default(0),
  creatorRating: integer("creator_rating"),
  businessRating: integer("business_rating"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Consents, kept as a log: what was agreed, which wording, when. */
export const consents = pgTable(
  "consents",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** terms | contact | public_kit */
    kind: text("kind").notNull(),
    granted: boolean("granted").notNull(),
    version: text("version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("consents_user").on(t.userId, t.kind)],
);

/**
 * A business inviting one matched creator to its brief. The creator sees the brief and fee and accepts or declines;
 * contact details are exchanged only on accept, which also opens the deal (source "mitra") and its deal room.
 */
export const invites = pgTable(
  "invites",
  {
    id: text("id").primaryKey(),
    opportunityId: text("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    businessUserId: text("business_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    creatorUserId: text("creator_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    feeInr: integer("fee_inr"),
    message: text("message"),
    /** Why Mitra suggested this creator, as shown to the business. */
    reasons: jsonb("reasons").$type<string[]>().notNull().default([]),
    /** pending | accepted | declined | withdrawn */
    status: text("status").notNull().default("pending"),
    dealId: text("deal_id").references(() => deals.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("invites_opportunity_creator").on(t.opportunityId, t.creatorUserId), index("invites_creator").on(t.creatorUserId, t.createdAt)],
);

/** The deal room: messages between the two sides of a deal Mitra brought. */
export const dealMessages = pgTable(
  "deal_messages",
  {
    id: serial("id").primaryKey(),
    dealId: text("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("deal_messages_deal").on(t.dealId, t.createdAt)],
);

/**
 * The offer inbox: every offer a creator receives, however it arrived (pasted, a screenshot read by AI, forwarded
 * by email or on WhatsApp), with the offer check and the sender check. Screenshots themselves are never stored.
 */
export const inboxOffers = pgTable(
  "inbox_offers",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** paste | screenshot | email | whatsapp */
    source: text("source").notNull(),
    senderName: text("sender_name"),
    senderEmail: text("sender_email"),
    senderPhone: text("sender_phone"),
    senderHandle: text("sender_handle"),
    subject: text("subject"),
    body: text("body").notNull(),
    checks: jsonb("checks").$type<{ term: string; state: string; text: string }[]>().notNull().default([]),
    /** The sender check (scam patterns, domain, brand records, other creators' reports). */
    verdict: jsonb("verdict").$type<Record<string, unknown>>(),
    /** new | saved | dismissed */
    status: text("status").notNull().default("new"),
    dealId: text("deal_id").references(() => deals.id, { onDelete: "set null" }),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("inbox_offers_user_time").on(t.userId, t.receivedAt)],
);

/**
 * Creators' reports about a sender (an email address, domain, phone or handle): "this was a scam" or "this was
 * fine". Shown to other creators as counts only, and only once two different creators agree.
 */
export const senderReports = pgTable(
  "sender_reports",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    senderKey: text("sender_key").notNull(),
    /** scam | ok */
    kind: text("kind").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sender_reports_user_key").on(t.userId, t.senderKey), index("sender_reports_key").on(t.senderKey)],
);

/** Answers from free public lookups (domain registration, DNS, Wikidata), kept for a few days to stay polite. */
export const lookupCache = pgTable("lookup_cache", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * A creator post a business tracks: any creator, found through Mitra or not, paid or barter. Each gets a promo code
 * the counter knows (RUCHI-SR) and a link (/r/<linkCode>) that hands the customer a coupon. Free to use; Mitra
 * never takes a cut of these.
 */
export const trackedPosts = pgTable(
  "tracked_posts",
  {
    id: text("id").primaryKey(),
    businessUserId: text("business_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** The creator as the business knows them; linked to a Mitra account when they're on Mitra. */
    creatorName: text("creator_name").notNull(),
    creatorHandle: text("creator_handle"),
    creatorUserId: text("creator_user_id").references(() => users.id, { onDelete: "set null" }),
    /** The Mitra deal this post belongs to, if it came through an invite. */
    dealId: text("deal_id").references(() => deals.id, { onDelete: "set null" }),
    /** paid | barter */
    kind: text("kind").notNull().default("paid"),
    /** What the creator is paid for the post (paid), or what they get (barter). */
    baseFeeInr: integer("base_fee_inr"),
    barterNote: text("barter_note"),
    /** What the customer gets for showing the coupon, e.g. "10% off your bill". */
    offerText: text("offer_text").notNull(),
    promoCode: text("promo_code").notNull(),
    linkCode: text("link_code").notNull().unique(),
    destinationUrl: text("destination_url"),
    postUrl: text("post_url"),
    /** active | ended */
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("tracked_posts_business_code").on(t.businessUserId, t.promoCode), index("tracked_posts_business_time").on(t.businessUserId, t.createdAt)],
);

/**
 * One customer's coupon from a tracked post, or a code typed at the counter. A coupon counts as a customer once
 * redeemed: by staff entering the counter PIN on the customer's phone (`pin`) or typing the code (`counter`).
 */
export const coupons = pgTable(
  "coupons",
  {
    id: text("id").primaryKey(),
    trackedPostId: text("tracked_post_id")
      .notNull()
      .references(() => trackedPosts.id, { onDelete: "cascade" }),
    /** link | counter */
    source: text("source").notNull().default("link"),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
    /** pin | counter */
    redeemedBy: text("redeemed_by"),
    /** Wrong PINs tried on this coupon (locked at 5). */
    pinTries: integer("pin_tries").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("coupons_post").on(t.trackedPostId, t.redeemedAt)],
);

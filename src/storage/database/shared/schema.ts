import { pgTable, serial, timestamp, varchar, integer, text, jsonb, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const creators = pgTable(
	"creators",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		// Profile
		name: varchar("name", { length: 255 }).notNull(),
		platform: varchar("platform", { length: 50 }).notNull(),
		platform_handle: varchar("platform_handle", { length: 255 }),
		platform_url: text("platform_url"),
		avatar_url: text("avatar_url"),
		region: varchar("region", { length: 50 }).notNull(),
		categories: jsonb("categories").$type<string[]>(),
		followers: integer("followers").default(0),
		follower_tier: varchar("follower_tier", { length: 20 }),
		content_type: varchar("content_type", { length: 20 }),
		languages: jsonb("languages").$type<string[]>(),
		bio: text("bio"),
		joined_date: varchar("joined_date", { length: 20 }),
		// Contact
		contact_info: jsonb("contact_info").$type<Array<{ type: string; value: string; reliability: string; source: string }>>(),
		// Evaluation
		fit_score: integer("fit_score"),
		cooperation_willingness: integer("cooperation_willingness"),
		content_style_tags: jsonb("content_style_tags").$type<string[]>(),
		audience_profile: text("audience_profile"),
		growth_trend: varchar("growth_trend", { length: 20 }),
		recommendation: text("recommendation"),
		// Outreach
		outreach_status: varchar("outreach_status", { length: 30 }).default("pending"),
		assigned_to: varchar("assigned_to", { length: 100 }),
		// Scraping metadata
		source_url: text("source_url"),
		scraped_at: timestamp("scraped_at", { withTimezone: true }),
		// Timestamps
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("creators_platform_idx").on(table.platform),
		index("creators_region_idx").on(table.region),
		index("creators_outreach_status_idx").on(table.outreach_status),
		index("creators_fit_score_idx").on(table.fit_score),
		index("creators_followers_idx").on(table.followers),
		index("creators_created_at_idx").on(table.created_at),
	]
);

export const scrape_jobs = pgTable(
	"scrape_jobs",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		status: varchar("status", { length: 20 }).notNull().default("pending"),
		platform: varchar("platform", { length: 50 }),
		category: varchar("category", { length: 50 }),
		region: varchar("region", { length: 50 }),
		query: text("query"),
		target_count: integer("target_count").default(20),
		scraped_count: integer("scraped_count").default(0),
		error_message: text("error_message"),
		started_at: timestamp("started_at", { withTimezone: true }),
		completed_at: timestamp("completed_at", { withTimezone: true }),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("scrape_jobs_status_idx").on(table.status),
		index("scrape_jobs_created_at_idx").on(table.created_at),
	]
);

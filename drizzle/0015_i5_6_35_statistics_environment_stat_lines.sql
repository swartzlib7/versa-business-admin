-- I5.6.35 Statistics -> Environment (S-4): stat_line captured-points table.
-- NOTE: this migration is hand-trimmed to the stat_line delta only. The
-- drizzle meta snapshot chain was missing snapshots for 0006-0014 (applied to
-- the live DB but never committed), so the generated diff re-emitted their
-- DDL (catalog_overlay + site_settings branding columns). Those already exist
-- in the database; re-running them would fail. The 0015 snapshot restores the
-- full-schema baseline going forward.
CREATE TABLE "stat_line" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"header_id" text NOT NULL,
	"series" integer DEFAULT 1 NOT NULL,
	"slot" integer NOT NULL,
	"value" numeric(18, 6) NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text DEFAULT 'ui' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stat_line" ADD CONSTRAINT "stat_line_header_id_record_id_fk" FOREIGN KEY ("header_id") REFERENCES "public"."record"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stat_line_header_series_slot_idx" ON "stat_line" USING btree ("header_id","series","slot");--> statement-breakpoint
CREATE INDEX "stat_line_header_idx" ON "stat_line" USING btree ("header_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stat_line_header_series_slot_unique" ON "stat_line" USING btree ("header_id","series","slot");

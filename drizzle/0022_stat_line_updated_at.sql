-- 1.0.20 (state_integrations.md §3.8): graph lines get a last-changed time, so an
-- integration pull can ask for "changed since". Existing lines take their capture time.
ALTER TABLE "stat_line" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
UPDATE "stat_line" SET "updated_at" = "captured_at";
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stat_line_updated_idx" ON "stat_line" ("header_id", "updated_at");

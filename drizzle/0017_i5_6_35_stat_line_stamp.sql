-- Period stamp for each statistic line (header start_datetime + slot).
-- De-dupe is (header_id, stamp) so the same clock instant cannot be captured twice.
ALTER TABLE "stat_line" ADD COLUMN "stamp" timestamptz;
--> statement-breakpoint
UPDATE "stat_line"
SET "stamp" = "captured_at"
  + make_interval(secs => "series")
  + ("slot" * interval '1 millisecond')
WHERE "stamp" IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "stat_line_header_stamp_unique" ON "stat_line" ("header_id","stamp");

-- 1.0.26 (state_shipments.md §5): Number automatically. One row per record type, field and
-- prefix holds the last number given. A new record takes its number inside the same
-- transaction as its insert (the row is locked), so two saves at once never share a number
-- and a save that fails gives its number back. Numbers of deleted records are not reused.
CREATE TABLE IF NOT EXISTS "record_number_counter" (
  "type_api_name" text NOT NULL,
  "field_api_name" text NOT NULL,
  "prefix" text DEFAULT '' NOT NULL,
  "last_value" bigint DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "record_number_counter_pk" PRIMARY KEY ("type_api_name", "field_api_name", "prefix")
);

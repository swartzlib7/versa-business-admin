CREATE TABLE "catalog_overlay" (
	"id" text PRIMARY KEY NOT NULL,
	"body" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

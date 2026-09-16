CREATE TABLE "site_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_name" text NOT NULL,
	"brand_color" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

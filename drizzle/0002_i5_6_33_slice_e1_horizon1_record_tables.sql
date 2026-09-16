CREATE TABLE "record" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"org_id" text NOT NULL,
	"record_type_id" text NOT NULL,
	"header" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "record_line" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"record_id" text,
	"organization_id" text,
	"line_group" text,
	"position" integer DEFAULT 0 NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "record_line_parent_check" CHECK (("record_line"."record_id" IS NULL) <> ("record_line"."organization_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "record_relations" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"org_id" text NOT NULL,
	"source_record_id" text NOT NULL,
	"target_record_id" text NOT NULL,
	"relation_kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "record_type" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"org_id" text NOT NULL,
	"api_name" text NOT NULL,
	"label" text NOT NULL,
	"parent_kind" text NOT NULL,
	"parent_api_name" text NOT NULL,
	"structure" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "record_type_api_name_unique" UNIQUE("api_name"),
	CONSTRAINT "record_type_parent_kind_check" CHECK ("record_type"."parent_kind" IN ('faculty', 'collaboration', 'environment', 'baked_in')),
	CONSTRAINT "record_type_structure_check" CHECK ("record_type"."structure" IN ('list', 'header', 'header_lines'))
);
--> statement-breakpoint
ALTER TABLE "field_definition" ADD COLUMN "lookup_delete_rule" text;--> statement-breakpoint
ALTER TABLE "record" ADD CONSTRAINT "record_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record" ADD CONSTRAINT "record_record_type_id_record_type_id_fk" FOREIGN KEY ("record_type_id") REFERENCES "public"."record_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record" ADD CONSTRAINT "record_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_line" ADD CONSTRAINT "record_line_record_id_record_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."record"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_line" ADD CONSTRAINT "record_line_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_relations" ADD CONSTRAINT "record_relations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_relations" ADD CONSTRAINT "record_relations_source_record_id_record_id_fk" FOREIGN KEY ("source_record_id") REFERENCES "public"."record"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_relations" ADD CONSTRAINT "record_relations_target_record_id_record_id_fk" FOREIGN KEY ("target_record_id") REFERENCES "public"."record"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "record_type" ADD CONSTRAINT "record_type_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "record_type_idx" ON "record" USING btree ("record_type_id");--> statement-breakpoint
CREATE INDEX "record_line_record_idx" ON "record_line" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "record_line_organization_idx" ON "record_line" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "record_relations_source_idx" ON "record_relations" USING btree ("source_record_id");--> statement-breakpoint
CREATE INDEX "record_relations_target_idx" ON "record_relations" USING btree ("target_record_id");--> statement-breakpoint
ALTER TABLE "field_definition" ADD CONSTRAINT "field_def_lookup_delete_rule_check" CHECK ("field_definition"."lookup_delete_rule" IS NULL OR "field_definition"."lookup_delete_rule" IN ('cascade', 'orphan'));
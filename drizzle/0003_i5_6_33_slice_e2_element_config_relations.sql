CREATE TABLE "element_config" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"org_id" text NOT NULL,
	"element_api_name" text NOT NULL,
	"head_user_id" text,
	"deputy_user_id" text,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "record_relations" ALTER COLUMN "target_record_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "record_relations" ADD COLUMN "target_organization_id" text;--> statement-breakpoint
ALTER TABLE "element_config" ADD CONSTRAINT "element_config_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "element_config" ADD CONSTRAINT "element_config_head_user_id_users_id_fk" FOREIGN KEY ("head_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "element_config" ADD CONSTRAINT "element_config_deputy_user_id_users_id_fk" FOREIGN KEY ("deputy_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "element_config_org_element_idx" ON "element_config" USING btree ("org_id","element_api_name");--> statement-breakpoint
ALTER TABLE "record_relations" ADD CONSTRAINT "record_relations_target_organization_id_organizations_id_fk" FOREIGN KEY ("target_organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "record_relations_target_org_idx" ON "record_relations" USING btree ("target_organization_id");--> statement-breakpoint
ALTER TABLE "record_relations" ADD CONSTRAINT "record_relations_target_check" CHECK (("record_relations"."target_record_id" IS NULL) <> ("record_relations"."target_organization_id" IS NULL));
ALTER TABLE "organizations" ADD COLUMN "is_person" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "org_type" text DEFAULT 'internal' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "parent_organization_id" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parent_organization_id_organizations_id_fk" FOREIGN KEY ("parent_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_org_type_check" CHECK ("organizations"."org_type" IN ('vendor', 'customer', 'partner', 'branch', 'internal'));
CREATE TABLE "departments" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"organization_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_definition" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"object_api_name" text NOT NULL,
	"api_name" text NOT NULL,
	"label" text NOT NULL,
	"data_type" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"default_value" text,
	"value_set_api_name" text,
	"lookup_object_api_name" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "field_def_data_type_check" CHECK ("field_definition"."data_type" IN ('text', 'long_text', 'number', 'boolean', 'date', 'datetime', 'picklist', 'multipicklist', 'lookup', 'email', 'url', 'phone', 'currency'))
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"product_id" text,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'disconnected' NOT NULL,
	"last_sync" timestamp with time zone,
	"description" text DEFAULT '' NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integrations_type_check" CHECK ("integrations"."type" IN ('email', 'cms', 'database', 'api', 'iot', 'messaging')),
	CONSTRAINT "integrations_status_check" CHECK ("integrations"."status" IN ('connected', 'disconnected', 'error'))
);
--> statement-breakpoint
CREATE TABLE "layout_definition" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"object_api_name" text NOT NULL,
	"api_name" text NOT NULL,
	"label" text NOT NULL,
	"layout_type" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"body" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	CONSTRAINT "layout_def_type_check" CHECK ("layout_definition"."layout_type" IN ('detail', 'edit', 'list'))
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"organization_id" text NOT NULL,
	"party_kind" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parties_kind_check" CHECK ("parties"."party_kind" IN ('vendor', 'customer', 'partner', 'branch'))
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text,
	"status" text DEFAULT 'available' NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_status_check" CHECK ("products"."status" IN ('available', 'beta', 'coming-soon'))
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"owner_user_id" text,
	"priority" text DEFAULT 'normal' NOT NULL,
	"start_date" date,
	"target_date" date,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_status_check" CHECK ("projects"."status" IN ('active', 'paused', 'completed', 'archived')),
	CONSTRAINT "projects_priority_check" CHECK ("projects"."priority" IN ('low', 'normal', 'high'))
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"assignee_user_id" text,
	"due_date" date,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasks_status_check" CHECK ("tasks"."status" IN ('planned', 'in_progress', 'waiting', 'blocked', 'done')),
	CONSTRAINT "tasks_priority_check" CHECK ("tasks"."priority" IN ('low', 'normal', 'high', 'urgent'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"type" text DEFAULT 'human' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"department_id" text,
	"password_hash" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_role_check" CHECK ("users"."role" IN ('admin', 'member')),
	CONSTRAINT "users_type_check" CHECK ("users"."type" IN ('human', 'agent')),
	CONSTRAINT "users_status_check" CHECK ("users"."status" IN ('active', 'inactive'))
);
--> statement-breakpoint
CREATE TABLE "value_set" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"api_name" text NOT NULL,
	"label" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	CONSTRAINT "value_set_api_name_unique" UNIQUE("api_name")
);
--> statement-breakpoint
CREATE TABLE "value_set_item" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"value_set_id" text NOT NULL,
	"api_value" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parties" ADD CONSTRAINT "parties_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_user_id_users_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "value_set_item" ADD CONSTRAINT "value_set_item_value_set_id_value_set_id_fk" FOREIGN KEY ("value_set_id") REFERENCES "public"."value_set"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "departments_org_code_idx" ON "departments" USING btree ("organization_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "field_def_obj_api_idx" ON "field_definition" USING btree ("object_api_name","api_name");--> statement-breakpoint
CREATE UNIQUE INDEX "layout_def_obj_api_ver_idx" ON "layout_definition" USING btree ("object_api_name","api_name","version");--> statement-breakpoint
CREATE UNIQUE INDEX "value_set_item_vs_api_idx" ON "value_set_item" USING btree ("value_set_id","api_value");
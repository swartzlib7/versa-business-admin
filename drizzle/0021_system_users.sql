-- 1.0.20 (state_integrations.md I13): integration tokens act as users of type "system".
-- They have no password and never sign in; they own what an integration writes.
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_type_check";
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_type_check" CHECK ("type" IN ('human', 'agent', 'system'));

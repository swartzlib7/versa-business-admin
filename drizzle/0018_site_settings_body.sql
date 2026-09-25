-- Site settings that have no column of their own (Page Builder, menus, modes, hero, footer).
-- Empty on upgrade; the first boot copies .data/site-settings.json into it.
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "body" jsonb DEFAULT '{}'::jsonb NOT NULL;

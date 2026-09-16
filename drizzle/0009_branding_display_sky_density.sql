ALTER TABLE "site_settings" ADD COLUMN "brand_logo_glow_color" text DEFAULT '#ffffff' NOT NULL;
ALTER TABLE "site_settings" ADD COLUMN "brand_logo_glow_spread" numeric(4,2) DEFAULT 0.5 NOT NULL;
ALTER TABLE "site_settings" ADD COLUMN "brand_logo_scale_menu" numeric(4,2) DEFAULT 1 NOT NULL;
ALTER TABLE "site_settings" ADD COLUMN "brand_logo_scale_home" numeric(4,2) DEFAULT 1 NOT NULL;
ALTER TABLE "site_settings" ADD COLUMN "brand_logo_scale_footer" numeric(4,2) DEFAULT 1 NOT NULL;
ALTER TABLE "site_settings" ADD COLUMN "constellation_density" numeric(4,2) DEFAULT 0 NOT NULL;

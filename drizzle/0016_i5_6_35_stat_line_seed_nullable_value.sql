-- I5.6.35: seeded frequency slots exist before a value is captured.
-- Empty (NULL) value = reserved slot, not a plotted point.
ALTER TABLE "stat_line" ALTER COLUMN "value" DROP NOT NULL;

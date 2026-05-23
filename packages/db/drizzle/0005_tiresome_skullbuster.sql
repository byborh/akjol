CREATE TABLE `schools` (
	`uai` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`postal_code` text,
	`region` text,
	`lat_x1e6` integer,
	`lng_x1e6` integer,
	`type` text,
	`website_url` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `schools_city_idx` ON `schools` (`city`);--> statement-breakpoint
CREATE INDEX `schools_type_idx` ON `schools` (`type`);--> statement-breakpoint
CREATE INDEX `schools_name_idx` ON `schools` (`name`);--> statement-breakpoint
ALTER TABLE `programs` ADD `is_curated` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `programs` ADD `school_uai` text;--> statement-breakpoint
CREATE INDEX `programs_curated_idx` ON `programs` (`is_curated`);--> statement-breakpoint
CREATE INDEX `programs_school_uai_idx` ON `programs` (`school_uai`);--> statement-breakpoint
UPDATE `programs` SET `is_curated` = 1 WHERE `source` = 'fixture';
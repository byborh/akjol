CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	`risk_automation_x100` integer DEFAULT 0 NOT NULL,
	`domains` text DEFAULT '[]' NOT NULL,
	`salary` text DEFAULT '[]' NOT NULL,
	`regions_top_hiring` text DEFAULT '[]' NOT NULL,
	`daily_tasks` text DEFAULT '[]' NOT NULL,
	`requires_diplomas` text DEFAULT '[]' NOT NULL,
	`match_keywords` text DEFAULT '[]' NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `jobs_code_idx` ON `jobs` (`code`);
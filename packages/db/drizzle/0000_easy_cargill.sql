CREATE TABLE `etude_metier_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`etude_id` integer NOT NULL,
	`metier_id` integer NOT NULL,
	FOREIGN KEY (`etude_id`) REFERENCES `etudes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`metier_id`) REFERENCES `metiers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `etudes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	`niveau` text NOT NULL,
	`duree` integer,
	`type` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `etudes_code_unique` ON `etudes` (`code`);--> statement-breakpoint
CREATE TABLE `formations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`etude_id` integer NOT NULL,
	`label` text NOT NULL,
	`etablissement` text,
	`ville` text,
	`voie` text,
	FOREIGN KEY (`etude_id`) REFERENCES `etudes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ingestion_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`started_at` integer DEFAULT (unixepoch()) NOT NULL,
	`finished_at` integer,
	`status` text DEFAULT 'running' NOT NULL,
	`inserted` integer DEFAULT 0 NOT NULL,
	`updated` integer DEFAULT 0 NOT NULL,
	`unchanged` integer DEFAULT 0 NOT NULL,
	`deprecated` integer DEFAULT 0 NOT NULL,
	`errors` integer DEFAULT 0 NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `metiers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	`secteur` text,
	`description` text,
	`salaire_min` integer,
	`salaire_max` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `metiers_code_unique` ON `metiers` (`code`);--> statement-breakpoint
CREATE TABLE `programs` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`source_id` text NOT NULL,
	`source_url` text,
	`last_ingested_at` integer DEFAULT (unixepoch()) NOT NULL,
	`content_hash` text NOT NULL,
	`deprecated` integer DEFAULT false NOT NULL,
	`deprecated_at` integer,
	`country_ref` text NOT NULL,
	`formation_code` text NOT NULL,
	`formation_label` text NOT NULL,
	`title` text NOT NULL,
	`level` text NOT NULL,
	`duration_years` integer NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`school_name` text NOT NULL,
	`school_city` text NOT NULL,
	`school_type` text,
	`school_website_url` text,
	`language_code` text NOT NULL,
	`language_min_level` text NOT NULL,
	`cost_per_year` integer DEFAULT 0 NOT NULL,
	`admission_platform` text NOT NULL,
	`application_opens` text,
	`application_closes` text,
	`application_fee` integer,
	`work_study` integer DEFAULT false NOT NULL,
	`resulting_diploma_code` text NOT NULL,
	`resulting_diploma_label` text NOT NULL,
	`min_grade` text,
	`accepted_diplomas` text DEFAULT '[]' NOT NULL,
	`domains` text DEFAULT '[]' NOT NULL,
	`outcomes_jobs` text DEFAULT '[]' NOT NULL,
	`outcomes_next_levels` text DEFAULT '[]' NOT NULL,
	`internationally_recognized_in` text DEFAULT '[]' NOT NULL,
	`documents` text DEFAULT '[]' NOT NULL,
	`optional_steps` text,
	`recommends_certificate` text,
	`recommends_internship_weeks` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `programs_source_sourceid_unique` ON `programs` (`source`,`source_id`);--> statement-breakpoint
CREATE INDEX `programs_country_idx` ON `programs` (`country_ref`);--> statement-breakpoint
CREATE INDEX `programs_level_idx` ON `programs` (`level`);--> statement-breakpoint
CREATE INDEX `programs_source_idx` ON `programs` (`source`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`canvas_data` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);

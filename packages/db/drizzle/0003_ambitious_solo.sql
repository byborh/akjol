CREATE TABLE `equivalence_edges` (
	`id` text PRIMARY KEY NOT NULL,
	`from_code` text NOT NULL,
	`to_code` text NOT NULL,
	`kind` text NOT NULL,
	`weight_x100` integer DEFAULT 100 NOT NULL,
	`note` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `equivalence_edges_from_idx` ON `equivalence_edges` (`from_code`);--> statement-breakpoint
CREATE INDEX `equivalence_edges_to_idx` ON `equivalence_edges` (`to_code`);--> statement-breakpoint
CREATE TABLE `equivalence_revisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`edge_id` text NOT NULL,
	`action` text NOT NULL,
	`snapshot_json` text,
	`at` integer DEFAULT (unixepoch()) NOT NULL,
	`by` text,
	FOREIGN KEY (`by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `equivalence_revisions_edge_idx` ON `equivalence_revisions` (`edge_id`);--> statement-breakpoint
CREATE INDEX `equivalence_revisions_at_idx` ON `equivalence_revisions` (`at`);
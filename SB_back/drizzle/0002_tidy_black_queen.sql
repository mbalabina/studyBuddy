ALTER TABLE `preferences` MODIFY COLUMN `preferredSchedule` json NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` MODIFY COLUMN `subjects` json NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` MODIFY COLUMN `schedule` json NOT NULL;
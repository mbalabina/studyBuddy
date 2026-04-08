ALTER TABLE `profiles` ADD `university` varchar(255);--> statement-breakpoint
ALTER TABLE `profiles` ADD `program` varchar(255);--> statement-breakpoint
ALTER TABLE `profiles` ADD `course` varchar(100);--> statement-breakpoint
ALTER TABLE `profiles` ADD `messengerHandle` varchar(255);--> statement-breakpoint
ALTER TABLE `preferences` DROP COLUMN `city`;--> statement-breakpoint
ALTER TABLE `profiles` DROP COLUMN `learningFormat`;--> statement-breakpoint
ALTER TABLE `profiles` DROP COLUMN `communicationStyle`;
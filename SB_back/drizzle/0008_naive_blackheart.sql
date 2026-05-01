CREATE TABLE `emailNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`notificationType` varchar(64) NOT NULL,
	`notificationKey` varchar(255) NOT NULL,
	`payload` json,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailNotifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailNotifications_notificationKey_unique` UNIQUE(`notificationKey`)
);
--> statement-breakpoint
CREATE TABLE `userStudyGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userStudyGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `favorites` ADD `goalId` int;--> statement-breakpoint
ALTER TABLE `profiles` ADD `motivation` json;--> statement-breakpoint
ALTER TABLE `profiles` ADD `learningStyle` json;--> statement-breakpoint
ALTER TABLE `profiles` ADD `additionalGoals` json;--> statement-breakpoint
ALTER TABLE `profiles` ADD `organization` int;--> statement-breakpoint
ALTER TABLE `profiles` ADD `sociability` int;--> statement-breakpoint
ALTER TABLE `profiles` ADD `friendliness` int;--> statement-breakpoint
ALTER TABLE `profiles` ADD `stressResistance` int;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetCodeHash` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetCodeExpiresAt` timestamp;
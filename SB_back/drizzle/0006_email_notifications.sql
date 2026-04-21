ALTER TABLE `users` ADD `lastSeenAt` timestamp;
--> statement-breakpoint
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
CREATE INDEX `emailNotifications_user_type_sent_idx` ON `emailNotifications` (`userId`,`notificationType`,`sentAt`);

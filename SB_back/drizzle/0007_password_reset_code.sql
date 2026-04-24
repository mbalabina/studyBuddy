ALTER TABLE `users` ADD `passwordResetCodeHash` varchar(128);
--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetCodeExpiresAt` timestamp;

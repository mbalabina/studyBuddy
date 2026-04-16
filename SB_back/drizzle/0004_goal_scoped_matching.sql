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
ALTER TABLE `favorites` ADD `goalId` int;
--> statement-breakpoint
CREATE INDEX `userStudyGoals_userId_idx` ON `userStudyGoals` (`userId`);
--> statement-breakpoint
CREATE INDEX `favorites_user_goal_idx` ON `favorites` (`userId`,`goalId`);
--> statement-breakpoint
INSERT INTO `userStudyGoals` (`userId`, `name`, `description`, `isActive`)
SELECT
  p.`userId`,
  p.`studyGoal`,
  p.`bio`,
  true
FROM `profiles` p
WHERE p.`studyGoal` IS NOT NULL
  AND TRIM(p.`studyGoal`) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM `userStudyGoals` g
    WHERE g.`userId` = p.`userId`
  );

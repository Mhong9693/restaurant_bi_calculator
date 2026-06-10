CREATE TABLE `dailyLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(128) NOT NULL,
	`logDate` varchar(10) NOT NULL,
	`normalOrders` int NOT NULL DEFAULT 0,
	`plusOrders` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailyLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gpSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(128) NOT NULL,
	`normalAvgPrice` decimal(10,2) NOT NULL DEFAULT '0',
	`normalGpPercent` decimal(5,2) NOT NULL DEFAULT '0',
	`plusAvgPrice` decimal(10,2) NOT NULL DEFAULT '0',
	`plusGpPercent` decimal(5,2) NOT NULL DEFAULT '0',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gpSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `gpSettings_sessionId_unique` UNIQUE(`sessionId`)
);

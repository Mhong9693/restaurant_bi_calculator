CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeName` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`province` varchar(100) NOT NULL,
	`foodCategory` varchar(100) NOT NULL,
	`pdpaConsent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menuItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`sellingPrice` decimal(10,2) NOT NULL,
	`foodCost` decimal(10,2) NOT NULL,
	`packagingCost` decimal(10,2) NOT NULL DEFAULT '0',
	`otherCost` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `menuItems_id` PRIMARY KEY(`id`)
);

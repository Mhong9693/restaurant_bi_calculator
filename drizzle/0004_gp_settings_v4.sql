ALTER TABLE `gpSettings` MODIFY COLUMN `normalGpPercent` decimal(5,2) NOT NULL DEFAULT '30';--> statement-breakpoint
ALTER TABLE `gpSettings` MODIFY COLUMN `plusGpPercent` decimal(5,2) NOT NULL DEFAULT '23';--> statement-breakpoint
ALTER TABLE `gpSettings` ADD `normalVatOnGp` decimal(5,2) DEFAULT '7' NOT NULL;--> statement-breakpoint
ALTER TABLE `gpSettings` ADD `normalTotalCost` decimal(10,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `gpSettings` ADD `plusVatOnGp` decimal(5,2) DEFAULT '7' NOT NULL;--> statement-breakpoint
ALTER TABLE `gpSettings` ADD `plusTotalCost` decimal(10,2) DEFAULT '0' NOT NULL;
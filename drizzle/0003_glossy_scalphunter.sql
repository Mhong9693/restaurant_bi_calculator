-- Rename normalGpPercent → normalCommission and plusGpPercent → plusCommission
-- GP% สุทธิจะถูกคำนวณ runtime แทน: (1 - commission% × 1.07) × 100
ALTER TABLE `gpSettings`
  CHANGE COLUMN `normalGpPercent` `normalCommission` decimal(5,2) NOT NULL DEFAULT '30',
  CHANGE COLUMN `plusGpPercent` `plusCommission` decimal(5,2) NOT NULL DEFAULT '23';

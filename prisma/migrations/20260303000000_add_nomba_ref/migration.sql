-- AlterTable: make paystack_ref nullable and add nomba_ref
ALTER TABLE `payments` MODIFY `paystack_ref` VARCHAR(191) NULL;
ALTER TABLE `payments` ADD COLUMN `nomba_ref` VARCHAR(191) NULL;
ALTER TABLE `payments` ADD UNIQUE INDEX `payments_nomba_ref_key` (`nomba_ref`);

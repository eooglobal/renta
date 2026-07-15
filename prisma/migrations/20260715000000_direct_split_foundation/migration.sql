-- Direct split payment foundation for Paystack subaccounts and transaction splits

ALTER TABLE `users`
  ADD COLUMN `bank_account_name` VARCHAR(191) NULL,
  ADD COLUMN `paystack_subaccount_code` VARCHAR(191) NULL,
  ADD COLUMN `paystack_subaccount_id` INTEGER NULL,
  ADD COLUMN `payment_setup_status` ENUM('NOT_STARTED', 'PENDING', 'VERIFIED', 'FAILED') NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN `payment_setup_verified_at` DATETIME(3) NULL;

ALTER TABLE `users`
  ADD UNIQUE INDEX `users_paystack_subaccount_code_key` (`paystack_subaccount_code`);

ALTER TABLE `rentals`
  ADD COLUMN `scout_id` INTEGER NULL,
  ADD COLUMN `affiliate_id` INTEGER NULL,
  ADD COLUMN `payment_mode` ENUM('ESCROW', 'DIRECT_SPLIT') NOT NULL DEFAULT 'ESCROW',
  ADD COLUMN `split_code` VARCHAR(191) NULL,
  ADD COLUMN `split_id` INTEGER NULL,
  ADD COLUMN `landlord_payout_amount` DECIMAL(12, 2) NULL,
  ADD COLUMN `platform_revenue_amount` DECIMAL(12, 2) NULL,
  ADD COLUMN `scout_commission_amount` DECIMAL(12, 2) NULL,
  ADD COLUMN `affiliate_commission_amount` DECIMAL(12, 2) NULL;

ALTER TABLE `rentals`
  ADD INDEX `rentals_scout_id_idx` (`scout_id`),
  ADD INDEX `rentals_affiliate_id_idx` (`affiliate_id`),
  ADD INDEX `rentals_payment_mode_idx` (`payment_mode`),
  ADD INDEX `rentals_split_code_idx` (`split_code`);

ALTER TABLE `payments`
  ADD COLUMN `gateway` ENUM('PAYSTACK', 'NOMBA') NOT NULL DEFAULT 'PAYSTACK',
  ADD COLUMN `gateway_payload` JSON NULL,
  ADD COLUMN `split_payload` JSON NULL;

ALTER TABLE `commissions`
  MODIFY `escrow_id` INTEGER NULL,
  MODIFY `status` ENUM('PENDING', 'PENDING_SETUP', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  ADD COLUMN `rental_id` INTEGER NULL,
  ADD COLUMN `settlement_mode` ENUM('WALLET', 'PAYSTACK_SPLIT', 'PENDING_SETUP', 'MANUAL', 'PLATFORM') NOT NULL DEFAULT 'WALLET',
  ADD COLUMN `paystack_subaccount_code` VARCHAR(191) NULL;

ALTER TABLE `commissions`
  ADD INDEX `commissions_rental_id_idx` (`rental_id`),
  ADD INDEX `commissions_settlement_mode_idx` (`settlement_mode`);

ALTER TABLE `commissions`
  ADD CONSTRAINT `commissions_rental_id_fkey`
  FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `rentals`
  ADD COLUMN `dispute_reason` TEXT NULL,
  ADD COLUMN `disputed_at` DATETIME(3) NULL,
  ADD COLUMN `disputed_by_id` INTEGER NULL,
  ADD COLUMN `dispute_resolved_at` DATETIME(3) NULL,
  ADD COLUMN `dispute_resolution_note` TEXT NULL;

ALTER TABLE `rentals`
  ADD INDEX `rentals_disputed_by_id_idx` (`disputed_by_id`);
CREATE TABLE `inspection_requests` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `property_id` VARCHAR(191) NOT NULL,
  `tenant_id` INTEGER NOT NULL,
  `tenant_phone` VARCHAR(191) NULL,
  `preferred_date` DATETIME(3) NULL,
  `preferred_time_window` VARCHAR(191) NULL,
  `status` ENUM('REQUESTED', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'REQUESTED',
  `scheduled_at` DATETIME(3) NULL,
  `assigned_staff_id` INTEGER NULL,
  `admin_note` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `inspection_requests`
  ADD INDEX `inspection_requests_property_id_idx` (`property_id`),
  ADD INDEX `inspection_requests_tenant_id_idx` (`tenant_id`),
  ADD INDEX `inspection_requests_status_idx` (`status`),
  ADD INDEX `inspection_requests_scheduled_at_idx` (`scheduled_at`),
  ADD INDEX `inspection_requests_assigned_staff_id_idx` (`assigned_staff_id`);

ALTER TABLE `inspection_requests`
  ADD CONSTRAINT `inspection_requests_property_id_fkey`
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `inspection_requests_tenant_id_fkey`
  FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `inspection_requests_assigned_staff_id_fkey`
  FOREIGN KEY (`assigned_staff_id`) REFERENCES `users`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

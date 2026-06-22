-- ============================================================
-- Renta — Full Database Schema for cPanel / phpMyAdmin import
-- Generated from prisma/schema.prisma (current state)
-- Import this file via: mysql -u user -p dbname < cpanel-schema.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

-- Drop all tables cleanly before recreating
DROP TABLE IF EXISTS `withdrawal_requests`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `wallets`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `maintenance_requests`;
DROP TABLE IF EXISTS `rental_agreements`;
DROP TABLE IF EXISTS `inspection_slots`;
DROP TABLE IF EXISTS `commissions`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `escrows`;
DROP TABLE IF EXISTS `rentals`;
DROP TABLE IF EXISTS `affiliate_referrals`;
DROP TABLE IF EXISTS `scout_areas`;
DROP TABLE IF EXISTS `property_images`;
DROP TABLE IF EXISTS `properties`;
DROP TABLE IF EXISTS `scout_leads`;
DROP TABLE IF EXISTS `areas`;
DROP TABLE IF EXISTS `cities`;
DROP TABLE IF EXISTS `tenant_profiles`;
DROP TABLE IF EXISTS `rate_limits`;
DROP TABLE IF EXISTS `platform_settings`;
DROP TABLE IF EXISTS `_prisma_migrations`;
DROP TABLE IF EXISTS `users`;

-- ── users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NULL,
  `password_hash` VARCHAR(191) NOT NULL,
  `role` ENUM('TENANT','LANDLORD','SCOUT','AFFILIATE','ADMIN') NOT NULL DEFAULT 'TENANT',
  `admin_role` ENUM('SUPER_ADMIN','VERIFICATION_OFFICER','SUPPORT') NULL,
  `first_name` VARCHAR(191) NOT NULL,
  `last_name` VARCHAR(191) NOT NULL,
  `avatar` VARCHAR(191) NULL,
  `nin_number` VARCHAR(191) NULL,
  `nin_status` ENUM('PENDING','VERIFIED','FAILED') NOT NULL DEFAULT 'PENDING',
  `status` ENUM('ACTIVE','SUSPENDED','BLACKLISTED') NOT NULL DEFAULT 'ACTIVE',
  `bank_name` VARCHAR(191) NULL,
  `bank_account` VARCHAR(191) NULL,
  `bank_code` VARCHAR(191) NULL,
  `referred_by_id` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `users_email_key` (`email`),
  UNIQUE INDEX `users_phone_key` (`phone`),
  UNIQUE INDEX `users_nin_number_key` (`nin_number`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── rate_limits ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `rate_limits` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ip` VARCHAR(191) NOT NULL,
  `endpoint` VARCHAR(191) NOT NULL,
  `count` INT NOT NULL DEFAULT 1,
  `expires_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `rate_limits_ip_endpoint_key` (`ip`, `endpoint`),
  INDEX `rate_limits_expires_at_idx` (`expires_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── tenant_profiles ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tenant_profiles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `employment_status` VARCHAR(191) NOT NULL,
  `monthly_income` DECIMAL(12,2) NOT NULL,
  `employer_name` VARCHAR(191) NULL,
  `previous_landlord_reference` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `tenant_profiles_user_id_key` (`user_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── cities ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `cities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `state` VARCHAR(191) NOT NULL,
  `latitude` DECIMAL(10,8) NULL,
  `longitude` DECIMAL(11,8) NULL,
  UNIQUE INDEX `cities_name_key` (`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── areas ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `areas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `city_id` INT NOT NULL,
  `latitude` DECIMAL(10,8) NULL,
  `longitude` DECIMAL(11,8) NULL,
  UNIQUE INDEX `areas_name_city_id_key` (`name`, `city_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── scout_leads ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `scout_leads` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `scout_id` INT NOT NULL,
  `landlord_name` VARCHAR(191) NOT NULL,
  `landlord_phone` VARCHAR(191) NOT NULL,
  `property_address` VARCHAR(191) NOT NULL,
  `area_id` INT NOT NULL,
  `notes` TEXT NULL,
  `status` ENUM('SUBMITTED','REVIEWING','APPROVED','REJECTED') NOT NULL DEFAULT 'SUBMITTED',
  `latitude` DECIMAL(10,8) NULL,
  `longitude` DECIMAL(11,8) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `scout_leads_scout_id_idx` (`scout_id`),
  INDEX `scout_leads_area_id_idx` (`area_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── properties ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `properties` (
  `id` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NULL,
  `landlord_id` INT NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `rent_price` DECIMAL(12,2) NOT NULL,
  `type` ENUM('SELF_CON','SINGLE_ROOM','FLAT','TWO_BEDROOM','THREE_BEDROOM') NOT NULL,
  `address` VARCHAR(191) NOT NULL,
  `state` VARCHAR(191) NOT NULL DEFAULT 'Kwara',
  `latitude` DECIMAL(10,8) NULL,
  `longitude` DECIMAL(11,8) NULL,
  `amenities` LONGTEXT NULL,
  `status` ENUM('PENDING','VERIFIED','RENTED','INACTIVE') NOT NULL DEFAULT 'PENDING',
  `verification_status` ENUM('UNVERIFIED','IN_PROGRESS','VERIFIED','REJECTED','SUSPICIOUS') NOT NULL DEFAULT 'UNVERIFIED',
  `verified_at` DATETIME(3) NULL,
  `verified_by_id` INT NULL,
  `scout_lead_id` INT NULL,
  `ownership_doc` VARCHAR(191) NULL,
  `student_friendly` BOOLEAN NOT NULL DEFAULT false,
  `featured_until` DATETIME(3) NULL,
  `is_featured` BOOLEAN NOT NULL DEFAULT false,
  `city_id` INT NOT NULL,
  `area_id` INT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `properties_slug_key` (`slug`),
  INDEX `properties_landlord_id_idx` (`landlord_id`),
  INDEX `properties_city_id_idx` (`city_id`),
  INDEX `properties_area_id_idx` (`area_id`),
  INDEX `properties_status_idx` (`status`),
  INDEX `properties_rent_price_idx` (`rent_price`),
  INDEX `properties_scout_lead_id_fkey` (`scout_lead_id`),
  INDEX `properties_verified_by_id_fkey` (`verified_by_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── property_images ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `property_images` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `property_id` VARCHAR(191) NOT NULL,
  `url` VARCHAR(191) NOT NULL,
  `caption` VARCHAR(191) NULL,
  `is_primary` BOOLEAN NOT NULL DEFAULT false,
  `latitude` DECIMAL(10,8) NULL,
  `longitude` DECIMAL(11,8) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `property_images_property_id_idx` (`property_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── scout_areas ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `scout_areas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `area_id` INT NOT NULL,
  UNIQUE INDEX `scout_areas_user_id_area_id_key` (`user_id`, `area_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── affiliate_referrals ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS `affiliate_referrals` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `affiliate_id` INT NOT NULL,
  `referral_code` VARCHAR(191) NOT NULL,
  `clicks` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `affiliate_referrals_referral_code_key` (`referral_code`),
  INDEX `affiliate_referrals_affiliate_id_idx` (`affiliate_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── rentals ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `rentals` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `property_id` VARCHAR(191) NOT NULL,
  `tenant_id` INT NOT NULL,
  `rent_amount` DECIMAL(12,2) NOT NULL,
  `service_fee` DECIMAL(12,2) NOT NULL,
  `total_paid` DECIMAL(12,2) NOT NULL,
  `start_date` DATETIME(3) NOT NULL,
  `end_date` DATETIME(3) NOT NULL,
  `status` ENUM('PENDING','ACTIVE','COMPLETED','DISPUTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `affiliate_referral_id` INT NULL,
  `paystack_ref` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `rentals_paystack_ref_key` (`paystack_ref`),
  INDEX `rentals_property_id_idx` (`property_id`),
  INDEX `rentals_tenant_id_idx` (`tenant_id`),
  INDEX `rentals_status_idx` (`status`),
  INDEX `rentals_affiliate_referral_id_fkey` (`affiliate_referral_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── escrows ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `escrows` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `rental_id` INT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `status` ENUM('PENDING','HELD','RELEASED','DISPUTED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `released_at` DATETIME(3) NULL,
  `released_by_id` INT NULL,
  `dispute_reason` TEXT NULL,
  `auto_release_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `escrows_rental_id_key` (`rental_id`),
  INDEX `escrows_released_by_id_fkey` (`released_by_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── payments ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `rental_id` INT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `paystack_ref` VARCHAR(191) NOT NULL,
  `status` ENUM('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
  `paid_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `payments_paystack_ref_key` (`paystack_ref`),
  INDEX `payments_rental_id_idx` (`rental_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── commissions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `commissions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `escrow_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `type` ENUM('SCOUT','AFFILIATE','PLATFORM') NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `percentage` DECIMAL(5,2) NOT NULL,
  `status` ENUM('PENDING','PAID','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `expires_at` DATETIME(3) NULL,
  `paid_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `commissions_escrow_id_idx` (`escrow_id`),
  INDEX `commissions_user_id_idx` (`user_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── inspection_slots ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `inspection_slots` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `property_id` VARCHAR(191) NOT NULL,
  `date` DATETIME(3) NOT NULL,
  `start_time` VARCHAR(191) NOT NULL,
  `end_time` VARCHAR(191) NOT NULL,
  `status` ENUM('AVAILABLE','BOOKED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'AVAILABLE',
  `booked_by_id` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `inspection_slots_property_id_idx` (`property_id`),
  INDEX `inspection_slots_date_idx` (`date`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── rental_agreements ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `rental_agreements` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `rental_id` INT NOT NULL,
  `document_url` VARCHAR(191) NULL,
  `tenant_signature` TEXT NULL,
  `landlord_signature` TEXT NULL,
  `tenant_signed` BOOLEAN NOT NULL DEFAULT false,
  `landlord_signed` BOOLEAN NOT NULL DEFAULT false,
  `tenant_signed_at` DATETIME(3) NULL,
  `landlord_signed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `rental_agreements_rental_id_key` (`rental_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── maintenance_requests ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS `maintenance_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `rental_id` INT NOT NULL,
  `tenant_id` INT NOT NULL,
  `category` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `images` LONGTEXT NULL,
  `status` ENUM('SUBMITTED','IN_PROGRESS','RESOLVED') NOT NULL DEFAULT 'SUBMITTED',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `maintenance_requests_rental_id_idx` (`rental_id`),
  INDEX `maintenance_requests_tenant_id_idx` (`tenant_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── messages ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sender_id` INT NOT NULL,
  `receiver_id` INT NOT NULL,
  `rental_id` INT NULL,
  `content` TEXT NOT NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `messages_sender_id_idx` (`sender_id`),
  INDEX `messages_receiver_id_idx` (`receiver_id`),
  INDEX `messages_rental_id_idx` (`rental_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT false,
  `link` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `notifications_user_id_idx` (`user_id`),
  INDEX `notifications_is_read_idx` (`is_read`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── wallets ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `wallets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_earned` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_withdrawn` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `wallets_user_id_key` (`user_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── transactions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `wallet_id` INT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `type` ENUM('CREDIT','DEBIT') NOT NULL,
  `description` VARCHAR(191) NULL,
  `reference_id` VARCHAR(191) NULL,
  `reference_type` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `transactions_wallet_id_idx` (`wallet_id`),
  INDEX `transactions_type_idx` (`type`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── withdrawal_requests ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS `withdrawal_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `wallet_id` INT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `status` ENUM('PENDING','APPROVED','PROCESSED','FAILED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `bank_name` VARCHAR(191) NOT NULL,
  `bank_account` VARCHAR(191) NOT NULL,
  `bank_code` VARCHAR(191) NULL,
  `processed_at` DATETIME(3) NULL,
  `processed_by_id` INT NULL,
  `admin_notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `withdrawal_requests_wallet_id_idx` (`wallet_id`),
  INDEX `withdrawal_requests_status_idx` (`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── platform_settings ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(191) NOT NULL,
  `value` TEXT NOT NULL,
  `type` VARCHAR(191) NOT NULL DEFAULT 'string',
  `label` VARCHAR(191) NOT NULL,
  `group` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `platform_settings_key_key` (`key`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── _prisma_migrations ────────────────────────────────────────
-- This tells Prisma that migrations have already been applied
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id` VARCHAR(36) NOT NULL,
  `checksum` VARCHAR(64) NOT NULL,
  `finished_at` DATETIME(3) NULL,
  `migration_name` VARCHAR(255) NOT NULL,
  `logs` TEXT NULL,
  `rolled_back_at` DATETIME(3) NULL,
  `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Mark both migrations as applied so Prisma doesn't try to run them
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('a1b2c3d4-0001-0001-0001-000000000001', 'manual', NOW(), '20260302191609_init', NULL, NULL, NOW(), 1),
('a1b2c3d4-0002-0002-0002-000000000002', 'manual', NOW(), '20260302205442_wallet_system', NULL, NULL, NOW(), 1);

-- ── Foreign Keys ──────────────────────────────────────────────
ALTER TABLE `users`
  ADD CONSTRAINT `users_referred_by_id_fkey` FOREIGN KEY (`referred_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `tenant_profiles`
  ADD CONSTRAINT `tenant_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `areas`
  ADD CONSTRAINT `areas_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `scout_leads`
  ADD CONSTRAINT `scout_leads_scout_id_fkey` FOREIGN KEY (`scout_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `scout_leads_area_id_fkey` FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `properties`
  ADD CONSTRAINT `properties_landlord_id_fkey` FOREIGN KEY (`landlord_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `properties_verified_by_id_fkey` FOREIGN KEY (`verified_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `properties_scout_lead_id_fkey` FOREIGN KEY (`scout_lead_id`) REFERENCES `scout_leads`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `properties_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `properties_area_id_fkey` FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `property_images`
  ADD CONSTRAINT `property_images_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `scout_areas`
  ADD CONSTRAINT `scout_areas_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `scout_areas_area_id_fkey` FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `affiliate_referrals`
  ADD CONSTRAINT `affiliate_referrals_affiliate_id_fkey` FOREIGN KEY (`affiliate_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `rentals`
  ADD CONSTRAINT `rentals_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `rentals_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `rentals_affiliate_referral_id_fkey` FOREIGN KEY (`affiliate_referral_id`) REFERENCES `affiliate_referrals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `escrows`
  ADD CONSTRAINT `escrows_rental_id_fkey` FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `escrows_released_by_id_fkey` FOREIGN KEY (`released_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `payments`
  ADD CONSTRAINT `payments_rental_id_fkey` FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `commissions`
  ADD CONSTRAINT `commissions_escrow_id_fkey` FOREIGN KEY (`escrow_id`) REFERENCES `escrows`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `commissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `inspection_slots`
  ADD CONSTRAINT `inspection_slots_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `rental_agreements`
  ADD CONSTRAINT `rental_agreements_rental_id_fkey` FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `maintenance_requests`
  ADD CONSTRAINT `maintenance_requests_rental_id_fkey` FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `maintenance_requests_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `messages`
  ADD CONSTRAINT `messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `messages_receiver_id_fkey` FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `wallets`
  ADD CONSTRAINT `wallets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_wallet_id_fkey` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `withdrawal_requests`
  ADD CONSTRAINT `withdrawal_requests_wallet_id_fkey` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;

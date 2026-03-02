-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role` ENUM('TENANT', 'LANDLORD', 'SCOUT', 'AFFILIATE', 'ADMIN') NOT NULL DEFAULT 'TENANT',
    `admin_role` ENUM('SUPER_ADMIN', 'VERIFICATION_OFFICER', 'SUPPORT') NULL,
    `first_name` VARCHAR(191) NOT NULL,
    `last_name` VARCHAR(191) NOT NULL,
    `avatar` VARCHAR(191) NULL,
    `nin_number` VARCHAR(191) NULL,
    `nin_status` ENUM('PENDING', 'VERIFIED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `status` ENUM('ACTIVE', 'SUSPENDED', 'BLACKLISTED') NOT NULL DEFAULT 'ACTIVE',
    `bank_name` VARCHAR(191) NULL,
    `bank_account` VARCHAR(191) NULL,
    `bank_code` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    UNIQUE INDEX `users_nin_number_key`(`nin_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `properties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `landlord_id` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `rent_price` DECIMAL(12, 2) NOT NULL,
    `type` ENUM('SELF_CON', 'SINGLE_ROOM', 'FLAT', 'TWO_BEDROOM', 'THREE_BEDROOM') NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `area` ENUM('TANKE', 'BASIN', 'MALETE', 'OTHER') NOT NULL,
    `city` VARCHAR(191) NOT NULL DEFAULT 'Ilorin',
    `state` VARCHAR(191) NOT NULL DEFAULT 'Kwara',
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `amenities` JSON NULL,
    `status` ENUM('PENDING', 'VERIFIED', 'RENTED', 'INACTIVE') NOT NULL DEFAULT 'PENDING',
    `verification_status` ENUM('UNVERIFIED', 'IN_PROGRESS', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'UNVERIFIED',
    `verified_at` DATETIME(3) NULL,
    `verified_by_id` INTEGER NULL,
    `scout_lead_id` INTEGER NULL,
    `ownership_doc` VARCHAR(191) NULL,
    `student_friendly` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `properties_landlord_id_idx`(`landlord_id`),
    INDEX `properties_area_idx`(`area`),
    INDEX `properties_status_idx`(`status`),
    INDEX `properties_rent_price_idx`(`rent_price`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `property_images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `caption` VARCHAR(191) NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `property_images_property_id_idx`(`property_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rentals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `tenant_id` INTEGER NOT NULL,
    `rent_amount` DECIMAL(12, 2) NOT NULL,
    `service_fee` DECIMAL(12, 2) NOT NULL,
    `total_paid` DECIMAL(12, 2) NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `affiliate_referral_id` INTEGER NULL,
    `paystack_ref` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rentals_paystack_ref_key`(`paystack_ref`),
    INDEX `rentals_property_id_idx`(`property_id`),
    INDEX `rentals_tenant_id_idx`(`tenant_id`),
    INDEX `rentals_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `escrows` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rental_id` INTEGER NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('HELD', 'RELEASED', 'DISPUTED', 'REFUNDED') NOT NULL DEFAULT 'HELD',
    `released_at` DATETIME(3) NULL,
    `released_by_id` INTEGER NULL,
    `dispute_reason` TEXT NULL,
    `auto_release_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `escrows_rental_id_key`(`rental_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rental_id` INTEGER NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `paystack_ref` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payments_paystack_ref_key`(`paystack_ref`),
    INDEX `payments_rental_id_idx`(`rental_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `escrow_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `type` ENUM('SCOUT', 'AFFILIATE', 'PLATFORM') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `percentage` DECIMAL(5, 2) NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `expires_at` DATETIME(3) NULL,
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `commissions_escrow_id_idx`(`escrow_id`),
    INDEX `commissions_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scout_leads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `scout_id` INTEGER NOT NULL,
    `landlord_name` VARCHAR(191) NOT NULL,
    `landlord_phone` VARCHAR(191) NOT NULL,
    `property_address` VARCHAR(191) NOT NULL,
    `property_area` ENUM('TANKE', 'BASIN', 'MALETE', 'OTHER') NOT NULL,
    `notes` TEXT NULL,
    `status` ENUM('SUBMITTED', 'REVIEWING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'SUBMITTED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `scout_leads_scout_id_idx`(`scout_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scout_areas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `area` ENUM('TANKE', 'BASIN', 'MALETE', 'OTHER') NOT NULL,

    UNIQUE INDEX `scout_areas_user_id_area_key`(`user_id`, `area`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `affiliate_referrals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `affiliate_id` INTEGER NOT NULL,
    `referral_code` VARCHAR(191) NOT NULL,
    `clicks` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `affiliate_referrals_referral_code_key`(`referral_code`),
    INDEX `affiliate_referrals_affiliate_id_idx`(`affiliate_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inspection_slots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `start_time` VARCHAR(191) NOT NULL,
    `end_time` VARCHAR(191) NOT NULL,
    `status` ENUM('AVAILABLE', 'BOOKED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'AVAILABLE',
    `booked_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `inspection_slots_property_id_idx`(`property_id`),
    INDEX `inspection_slots_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rental_agreements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rental_id` INTEGER NOT NULL,
    `document_url` VARCHAR(191) NULL,
    `tenant_signed` BOOLEAN NOT NULL DEFAULT false,
    `landlord_signed` BOOLEAN NOT NULL DEFAULT false,
    `tenant_signed_at` DATETIME(3) NULL,
    `landlord_signed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `rental_agreements_rental_id_key`(`rental_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `maintenance_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rental_id` INTEGER NOT NULL,
    `tenant_id` INTEGER NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `images` JSON NULL,
    `status` ENUM('SUBMITTED', 'IN_PROGRESS', 'RESOLVED') NOT NULL DEFAULT 'SUBMITTED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `maintenance_requests_rental_id_idx`(`rental_id`),
    INDEX `maintenance_requests_tenant_id_idx`(`tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sender_id` INTEGER NOT NULL,
    `receiver_id` INTEGER NOT NULL,
    `rental_id` INTEGER NULL,
    `content` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `messages_sender_id_idx`(`sender_id`),
    INDEX `messages_receiver_id_idx`(`receiver_id`),
    INDEX `messages_rental_id_idx`(`rental_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `link` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_idx`(`user_id`),
    INDEX `notifications_is_read_idx`(`is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `properties` ADD CONSTRAINT `properties_landlord_id_fkey` FOREIGN KEY (`landlord_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `properties` ADD CONSTRAINT `properties_verified_by_id_fkey` FOREIGN KEY (`verified_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `properties` ADD CONSTRAINT `properties_scout_lead_id_fkey` FOREIGN KEY (`scout_lead_id`) REFERENCES `scout_leads`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `property_images` ADD CONSTRAINT `property_images_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rentals` ADD CONSTRAINT `rentals_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rentals` ADD CONSTRAINT `rentals_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rentals` ADD CONSTRAINT `rentals_affiliate_referral_id_fkey` FOREIGN KEY (`affiliate_referral_id`) REFERENCES `affiliate_referrals`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `escrows` ADD CONSTRAINT `escrows_rental_id_fkey` FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `escrows` ADD CONSTRAINT `escrows_released_by_id_fkey` FOREIGN KEY (`released_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_rental_id_fkey` FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_escrow_id_fkey` FOREIGN KEY (`escrow_id`) REFERENCES `escrows`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scout_leads` ADD CONSTRAINT `scout_leads_scout_id_fkey` FOREIGN KEY (`scout_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scout_areas` ADD CONSTRAINT `scout_areas_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `affiliate_referrals` ADD CONSTRAINT `affiliate_referrals_affiliate_id_fkey` FOREIGN KEY (`affiliate_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inspection_slots` ADD CONSTRAINT `inspection_slots_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_agreements` ADD CONSTRAINT `rental_agreements_rental_id_fkey` FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maintenance_requests` ADD CONSTRAINT `maintenance_requests_rental_id_fkey` FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maintenance_requests` ADD CONSTRAINT `maintenance_requests_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_receiver_id_fkey` FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `property_videos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `original_name` VARCHAR(191) NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `size_bytes` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `property_videos_property_id_idx`(`property_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `property_videos` ADD CONSTRAINT `property_videos_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
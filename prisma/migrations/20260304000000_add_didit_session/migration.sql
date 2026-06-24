-- Add Didit session tracking to users table
ALTER TABLE `users` ADD COLUMN `didit_session_id` VARCHAR(191) NULL;
ALTER TABLE `users` ADD UNIQUE INDEX `users_didit_session_id_key` (`didit_session_id`);

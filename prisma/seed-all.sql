-- ============================================================
-- Renta — Complete Seed Data for phpMyAdmin import
-- Run this AFTER cpanel-schema.sql has been imported
-- ============================================================

-- ── 1. Cities ─────────────────────────────────────────────────
INSERT INTO `cities` (`name`, `state`, `latitude`, `longitude`) VALUES
('Ilorin', 'Kwara', 8.4799, 4.5418),
('Lagos',  'Lagos', 6.5244, 3.3792)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- ── 2. Areas ──────────────────────────────────────────────────
-- Ilorin areas (city_id = 1)
INSERT INTO `areas` (`name`, `city_id`, `latitude`, `longitude`) VALUES
('TANKE',    1, 8.484,  4.595),
('BASIN',    1, 8.496,  4.568),
('MALETE',   1, 8.718,  4.471),
('ADETA',    1, 8.485,  4.515),
('CHALLENGE',1, 8.475,  4.545)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- Lagos areas (city_id = 2)
INSERT INTO `areas` (`name`, `city_id`, `latitude`, `longitude`) VALUES
('LEKKI',            2, 6.459,  3.601),
('IKEJA',            2, 6.6018, 3.3515),
('VICTORIA ISLAND',  2, 6.428,  3.421)
ON DUPLICATE KEY UPDATE `name` = `name`;

-- ── 3. Platform Settings ──────────────────────────────────────
INSERT INTO `platform_settings` (`key`, `value`, `type`, `label`, `group`, `description`) VALUES
('platform_fee_percent',      '10',            'number', 'Platform Service Fee (%)',    'fees',     'Total platform service fee charged to tenants on each rental transaction.'),
('scout_commission_percent',  '3',             'number', 'Scout Commission (%)',        'fees',     'Percentage of the platform fee allocated to scouts for property leads.'),
('affiliate_commission_percent','2',           'number', 'Affiliate Commission (%)',    'fees',     'Percentage of the platform fee allocated to affiliates for referrals.'),
('featured_listing_price',    '5000',          'number', 'Featured Listing Price (₦)', 'fees',     'Price charged to landlords for promoting a listing as featured.'),
('min_withdrawal_amount',     '10000',         'number', 'Minimum Withdrawal (₦)',     'payouts',  'Minimum amount a user must have in their wallet to request a withdrawal.'),
('escrow_release_days',       '7',             'number', 'Escrow Release Period (Days)','payouts', 'Number of days after tenant move-in confirmation before escrow is automatically released to the landlord.'),
('maintenance_contact',       '+234 800 123 4567','string','Maintenance Contact',       'platform', 'Phone number tenants and landlords can use for emergency maintenance support.'),
('support_email',             'support@renta.com','string','Support Email',             'platform', 'Email address for customer support inquiries.'),
('max_property_images',       '10',            'number', 'Max Property Images',        'platform', 'Maximum number of images a landlord can upload per property listing.')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- ── 4. Super Admin Account ────────────────────────────────────
-- Password: BiGeMMy.50796 (bcrypt hash)
INSERT INTO `users` (
  `email`, `password_hash`, `role`, `admin_role`,
  `first_name`, `last_name`, `nin_status`, `status`,
  `created_at`, `updated_at`
) VALUES (
  'admin@renta.com',
  '$2b$12$ZjvRebLBGEZZdMEdhlAh2OTb/LQODfYslPp4U3OHlTcfQoeRWYkly',
  'ADMIN',
  'SUPER_ADMIN',
  'Renta',
  'Admin',
  'VERIFIED',
  'ACTIVE',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  `role` = 'ADMIN',
  `admin_role` = 'SUPER_ADMIN',
  `nin_status` = 'VERIFIED',
  `status` = 'ACTIVE';

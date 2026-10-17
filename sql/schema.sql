-- ==============================================================================
-- VA TrackOS — Complete Executable Database Schema
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+, XAMPP, and phpMyAdmin
-- Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci | Engine: InnoDB
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS `va_trackos`;
CREATE DATABASE `va_trackos` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `va_trackos`;

-- ------------------------------------------------------------------------------
-- 1. Table: users
-- Core authentication and role-based access control (Admin & VA Specialist)
-- ------------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'va') NOT NULL DEFAULT 'va',
  `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  `avatar_initials` VARCHAR(4) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table: services
-- Catalog of agency service offerings matching application workflows
-- ------------------------------------------------------------------------------
CREATE TABLE `services` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `service_name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_services_name` (`service_name`),
  UNIQUE KEY `uk_services_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table: clients
-- Client company records tracked in the agency pipeline
-- ------------------------------------------------------------------------------
CREATE TABLE `clients` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `client_name` VARCHAR(150) NOT NULL,
  `contact_name` VARCHAR(100) DEFAULT NULL,
  `industry` VARCHAR(100) NOT NULL DEFAULT 'General',
  `tier` ENUM('starter', 'growth', 'enterprise') NOT NULL DEFAULT 'growth',
  `service_id` INT UNSIGNED DEFAULT NULL,
  `service_type` VARCHAR(100) NOT NULL,
  `deadline` DATE NOT NULL,
  `percentage` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `notes` TEXT DEFAULT NULL,
  `status` ENUM('active', 'completed', 'in_review', 'revision', 'cancelled') NOT NULL DEFAULT 'active',
  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_clients_name` (`client_name`),
  KEY `idx_clients_service_id` (`service_id`),
  KEY `idx_clients_deadline` (`deadline`),
  KEY `idx_clients_status` (`status`),
  KEY `idx_clients_created_by` (`created_by`),
  CONSTRAINT `fk_clients_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_clients_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table: pipelines
-- Client execution workflow pipeline container
-- ------------------------------------------------------------------------------
CREATE TABLE `pipelines` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `client_id` INT UNSIGNED NOT NULL,
  `pipeline_name` VARCHAR(150) NOT NULL,
  `status` ENUM('active', 'completed', 'paused') NOT NULL DEFAULT 'active',
  `deadline` DATE DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_pipelines_client_id` (`client_id`),
  KEY `idx_pipelines_status` (`status`),
  CONSTRAINT `fk_pipelines_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Table: pipeline_stages
-- Sequential Virtual Assistant stages in a client pipeline
-- Status values match frontend: queued, active (In Charge), in_review, revision, completed
-- ------------------------------------------------------------------------------
CREATE TABLE `pipeline_stages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `pipeline_id` INT UNSIGNED NOT NULL,
  `client_id` INT UNSIGNED NOT NULL,
  `stage_order` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `role_name` VARCHAR(150) NOT NULL,
  `assigned_va_id` INT UNSIGNED DEFAULT NULL,
  `assigned_va_name` VARCHAR(100) NOT NULL,
  `status` ENUM('queued', 'active', 'in_review', 'revision', 'completed') NOT NULL DEFAULT 'queued',
  `deadline` DATE NULL DEFAULT NULL,
  `started_at` TIMESTAMP NULL DEFAULT NULL,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_stages_pipeline_id` (`pipeline_id`),
  KEY `idx_stages_client_id` (`client_id`),
  KEY `idx_stages_assigned_va_id` (`assigned_va_id`),
  KEY `idx_stages_status` (`status`),
  KEY `idx_stages_order` (`stage_order`),
  CONSTRAINT `fk_stages_pipeline` FOREIGN KEY (`pipeline_id`) REFERENCES `pipelines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_stages_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_stages_va` FOREIGN KEY (`assigned_va_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Table: tasks
-- Granular tasks corresponding to assigned stages or ad-hoc assignments
-- ------------------------------------------------------------------------------
CREATE TABLE `tasks` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `client_id` INT UNSIGNED NOT NULL,
  `pipeline_stage_id` INT UNSIGNED DEFAULT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  `status` ENUM('queued', 'active', 'in_review', 'revision', 'completed') NOT NULL DEFAULT 'queued',
  `deadline` DATE DEFAULT NULL,
  `assigned_va_id` INT UNSIGNED DEFAULT NULL,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_tasks_client_id` (`client_id`),
  KEY `idx_tasks_stage_id` (`pipeline_stage_id`),
  KEY `idx_tasks_va_id` (`assigned_va_id`),
  KEY `idx_tasks_status` (`status`),
  CONSTRAINT `fk_tasks_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tasks_stage` FOREIGN KEY (`pipeline_stage_id`) REFERENCES `pipeline_stages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tasks_va` FOREIGN KEY (`assigned_va_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_tasks_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Table: deliverables
-- Work submitted by Virtual Assistants awaiting Quality Assurance review
-- ------------------------------------------------------------------------------
CREATE TABLE `deliverables` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT UNSIGNED DEFAULT NULL,
  `pipeline_stage_id` INT UNSIGNED NOT NULL,
  `client_id` INT UNSIGNED NOT NULL,
  `submitted_by` INT UNSIGNED NOT NULL,
  `report_text` TEXT NOT NULL,
  `external_link` VARCHAR(500) DEFAULT NULL,
  `file_name` VARCHAR(255) DEFAULT NULL,
  `file_path` VARCHAR(500) DEFAULT NULL,
  `file_type` VARCHAR(100) DEFAULT NULL,
  `file_size` INT UNSIGNED DEFAULT NULL,
  `status` ENUM('pending', 'approved', 'revision_requested') NOT NULL DEFAULT 'pending',
  `submitted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_deliverables_stage` (`pipeline_stage_id`),
  KEY `idx_deliverables_client` (`client_id`),
  KEY `idx_deliverables_submitter` (`submitted_by`),
  KEY `idx_deliverables_status` (`status`),
  CONSTRAINT `fk_deliv_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_deliv_stage` FOREIGN KEY (`pipeline_stage_id`) REFERENCES `pipeline_stages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_deliv_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_deliv_user` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Table: reviews
-- Administrator QA review feedback, acceptance, or revision instructions
-- ------------------------------------------------------------------------------
CREATE TABLE `reviews` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `deliverable_id` INT UNSIGNED NOT NULL,
  `reviewer_id` INT UNSIGNED NOT NULL,
  `decision` ENUM('approved', 'revision_requested') NOT NULL,
  `feedback` TEXT DEFAULT NULL,
  `reviewed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_reviews_deliverable` (`deliverable_id`),
  KEY `idx_reviews_reviewer` (`reviewer_id`),
  CONSTRAINT `fk_reviews_deliv` FOREIGN KEY (`deliverable_id`) REFERENCES `deliverables` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. Table: calendar_events
-- Milestones, deadline markers, and schedule items for Google Calendar view
-- ------------------------------------------------------------------------------
CREATE TABLE `calendar_events` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE DEFAULT NULL,
  `event_type` ENUM('deadline', 'milestone', 'meeting', 'review') NOT NULL DEFAULT 'deadline',
  `client_id` INT UNSIGNED DEFAULT NULL,
  `service_type` VARCHAR(100) DEFAULT NULL,
  `created_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_cal_start_date` (`start_date`),
  KEY `idx_cal_client_id` (`client_id`),
  CONSTRAINT `fk_cal_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cal_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. Table: pings
-- Instant check-in and priority alerts sent by Admins to assigned VAs
-- ------------------------------------------------------------------------------
CREATE TABLE `pings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `client_id` INT UNSIGNED DEFAULT NULL,
  `stage_id` INT UNSIGNED DEFAULT NULL,
  `sender_id` INT UNSIGNED NOT NULL,
  `target_va_id` INT UNSIGNED DEFAULT NULL,
  `target_va_name` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `is_urgent` BOOLEAN NOT NULL DEFAULT FALSE,
  `status` ENUM('unread', 'read') NOT NULL DEFAULT 'unread',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_pings_target_va` (`target_va_name`),
  KEY `idx_pings_status` (`status`),
  KEY `idx_pings_created_at` (`created_at`),
  CONSTRAINT `fk_pings_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pings_stage` FOREIGN KEY (`stage_id`) REFERENCES `pipeline_stages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pings_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pings_target` FOREIGN KEY (`target_va_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. Table: activity_logs
-- Immutable chronological audit trail of all pipeline actions
-- ------------------------------------------------------------------------------
CREATE TABLE `activity_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `actor_id` INT UNSIGNED DEFAULT NULL,
  `actor_name` VARCHAR(100) NOT NULL,
  `actor_role` VARCHAR(50) NOT NULL,
  `action_type` ENUM('submission', 'approval', 'revision', 'ping', 'lifecycle') NOT NULL,
  `client_id` INT UNSIGNED DEFAULT NULL,
  `client_name` VARCHAR(150) NOT NULL,
  `stage_name` VARCHAR(150) DEFAULT NULL,
  `target_va` VARCHAR(100) DEFAULT NULL,
  `title` VARCHAR(200) NOT NULL,
  `summary` TEXT DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `metadata_json` JSON DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_act_type` (`action_type`),
  KEY `idx_act_client` (`client_name`),
  KEY `idx_act_va` (`target_va`),
  KEY `idx_act_created` (`created_at`),
  CONSTRAINT `fk_act_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- INITIAL SEED DATA
-- Default system administrator and standard agency service packages
-- Default Admin credentials:
-- Email: admin@vatrack.io | Password: admin
-- (BCrypt hash with 10 salt rounds: $2a$10$wN1QeY9uLg8W0Qc1iZ1A2eY1wX5i8uO6lC.n4D8k1c5q3o7y9i1aW)
-- ==============================================================================

INSERT INTO `services` (`service_name`, `slug`, `description`) VALUES
('Social Starter', 'social-starter', 'Essential social media management, baseline assets, and weekly curation.'),
('Social Growth', 'social-growth', 'High-velocity content production, engagement sprints, and multichannel outreach.'),
('Clinics Ops Lite', 'clinics-ops-lite', 'Core healthcare practice operations, patient intake workflows, and reminder automation.'),
('Clinics Ops Standard', 'clinics-ops-standard', 'Comprehensive clinic management, EMR synchronization, HIPAA-compliant intake, and billing audits.'),
('Foundation Bundle', 'foundation-bundle', 'Complete enterprise administrative onboarding, SOP documentation, and multi-VA pipeline allocation.');

-- ==============================================================================
-- Default User Accounts (Admins & VA Specialists)
-- Passwords:
-- admin@vatrack.io  -> admin
-- canci@vatrack.io  -> Password123!
-- VA Specialists    -> password123
-- ==============================================================================
INSERT INTO `users` (`full_name`, `email`, `password_hash`, `role`, `status`, `avatar_initials`) VALUES
('System Administrator', 'admin@vatrack.io', '$2a$10$ZgnNNWXf3WlG7TCdEGyxHeKz7RoZipmlcAk5/WXHnhvCK5GURotOy', 'admin', 'active', 'AD'),
('Canci Admin', 'canci@vatrack.io', '$2a$10$l/M67vR4j7VnEv0N3qLpM.5XoXm8hS.V6BupP8L4WvQ9MhU8O8x2W', 'admin', 'active', 'CA'),
('Elena Rostova', 'elena@vatrack.io', '$2a$10$pU2u1wR2qU9P7X1Ue7s7..V3wB9lQ7Jp2yU8jF5O6X9U1mG7Z1a2e', 'va', 'active', 'ER'),
('Marcus Chen', 'marcus@vatrack.io', '$2a$10$pU2u1wR2qU9P7X1Ue7s7..V3wB9lQ7Jp2yU8jF5O6X9U1mG7Z1a2e', 'va', 'active', 'MC'),
('Sarah Jenkins', 'sarah@vatrack.io', '$2a$10$pU2u1wR2qU9P7X1Ue7s7..V3wB9lQ7Jp2yU8jF5O6X9U1mG7Z1a2e', 'va', 'active', 'SJ'),
('David Kim', 'david@vatrack.io', '$2a$10$pU2u1wR2qU9P7X1Ue7s7..V3wB9lQ7Jp2yU8jF5O6X9U1mG7Z1a2e', 'va', 'active', 'DK'),
('Aisha Patel', 'aisha@vatrack.io', '$2a$10$pU2u1wR2qU9P7X1Ue7s7..V3wB9lQ7Jp2yU8jF5O6X9U1mG7Z1a2e', 'va', 'active', 'AP');

SET FOREIGN_KEY_CHECKS = 1;

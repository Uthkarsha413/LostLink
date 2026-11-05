
-- =====================================================
-- LostLink: AI-Powered Lost & Found Management System
-- Database: MySQL
-- Purpose: Create the main application database
-- =====================================================

CREATE DATABASE IF NOT EXISTS lostlink_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

USE lostlink_db;

-- Verify database creation
SELECT
    SCHEMA_NAME,
    DEFAULT_CHARACTER_SET_NAME,
    DEFAULT_COLLATION_NAME
FROM INFORMATION_SCHEMA.SCHEMATA
WHERE SCHEMA_NAME = 'lostlink_db';

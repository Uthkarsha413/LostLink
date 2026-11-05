-- ============================================================
-- LostLink - Database Verification Tests
-- ============================================================

USE lostlink_db;

-- TEST 1: Verify all 19 tables exist
SELECT
    COUNT(*) AS total_tables
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'lostlink_db'
  AND TABLE_TYPE = 'BASE TABLE';

-- TEST 2: Verify all 3 reporting views exist
SELECT
    COUNT(*) AS total_views
FROM INFORMATION_SCHEMA.VIEWS
WHERE TABLE_SCHEMA = 'lostlink_db';

-- TEST 3: Verify seeded roles
SELECT role_name
FROM roles
ORDER BY role_id;

-- TEST 4: Verify seeded categories
SELECT category_name
FROM categories
ORDER BY category_name;

-- TEST 5: Verify campus location records by type and status
SELECT
    location_type,
    data_status,
    COUNT(*) AS total_locations
FROM campus_locations
GROUP BY location_type, data_status
ORDER BY location_type;

-- TEST 6: Verify foreign-key constraints
SELECT
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'lostlink_db'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- TEST 7: Verify indexes on item_reports
SHOW INDEX FROM item_reports;

-- TEST 8: Verify reporting views can execute
SELECT COUNT(*) AS active_report_rows
FROM vw_active_reports;

SELECT COUNT(*) AS pending_claim_rows
FROM vw_pending_claims;

SELECT *
FROM vw_campus_report_analytics;

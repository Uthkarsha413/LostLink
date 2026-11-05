-- ============================================================
-- LostLink - Reporting Views
-- ============================================================

USE lostlink_db;

-- 1. Active LOST and FOUND reports
CREATE OR REPLACE VIEW vw_active_reports AS
SELECT
    r.report_id,
    r.report_type,
    r.title,
    r.description,
    r.brand,
    r.color,
    r.event_datetime,
    r.report_status,
    r.created_at,
    u.user_id,
    u.full_name AS reported_by,
    c.category_name,
    l.location_name
FROM item_reports r
JOIN users u
    ON r.user_id = u.user_id
JOIN categories c
    ON r.category_id = c.category_id
LEFT JOIN campus_locations l
    ON r.location_id = l.location_id
WHERE r.report_status IN ('ACTIVE', 'MATCHED');


-- 2. Claims waiting for review
CREATE OR REPLACE VIEW vw_pending_claims AS
SELECT
    cl.claim_id,
    cl.claimant_id,
    u.full_name AS claimant_name,
    cl.lost_report_id,
    lost.title AS lost_item,
    cl.found_report_id,
    found.title AS found_item,
    cl.match_id,
    cl.claim_status,
    cl.submitted_at
FROM claims cl
JOIN users u
    ON cl.claimant_id = u.user_id
JOIN item_reports lost
    ON cl.lost_report_id = lost.report_id
JOIN item_reports found
    ON cl.found_report_id = found.report_id
WHERE cl.claim_status IN (
    'SUBMITTED',
    'AI_REVIEW_PENDING',
    'MODERATOR_REVIEW',
    'ADMIN_REVIEW'
);


-- 3. Campus report analytics by category and type
CREATE OR REPLACE VIEW vw_campus_report_analytics AS
SELECT
    c.category_id,
    c.category_name,
    r.report_type,
    COUNT(*) AS total_reports,
    SUM(
        CASE WHEN r.report_status = 'ACTIVE' THEN 1 ELSE 0 END
    ) AS active_reports,
    SUM(
        CASE WHEN r.report_status = 'MATCHED' THEN 1 ELSE 0 END
    ) AS matched_reports,
    SUM(
        CASE WHEN r.report_status = 'CLOSED' THEN 1 ELSE 0 END
    ) AS closed_reports
FROM item_reports r
JOIN categories c
    ON r.category_id = c.category_id
GROUP BY
    c.category_id,
    c.category_name,
    r.report_type;

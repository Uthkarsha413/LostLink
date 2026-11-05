
-- ============================================================
-- LostLink - Additional Indexes and Integrity Constraints
-- Database: lostlink_db
-- MySQL 8.0.16+
-- ============================================================

USE lostlink_db;

-- 1. USER INDEXES
CREATE INDEX idx_users_account_status
ON users(account_status);

CREATE INDEX idx_users_name
ON users(full_name);

-- 2. ROLE INDEXES
CREATE INDEX idx_user_roles_role
ON user_roles(role_id);

-- 3. CAMPUS LOCATION INDEXES
CREATE INDEX idx_locations_parent
ON campus_locations(parent_location_id);

CREATE INDEX idx_locations_type_status
ON campus_locations(location_type, is_active);

CREATE INDEX idx_locations_code
ON campus_locations(location_code);

-- 4. ITEM REPORT INDEXES
CREATE INDEX idx_reports_user
ON item_reports(user_id);

CREATE INDEX idx_reports_browse
ON item_reports(
    report_status,
    report_type,
    category_id,
    location_id,
    created_at
);

CREATE INDEX idx_reports_event_datetime
ON item_reports(event_datetime);

-- Full-text search for report titles and descriptions.
CREATE FULLTEXT INDEX idx_reports_fulltext
ON item_reports(title, description);

-- 5. IMAGE INDEXES
CREATE INDEX idx_images_report
ON report_images(report_id);

CREATE INDEX idx_images_quality
ON report_images(image_quality_status);

CREATE INDEX idx_image_analyses_status
ON image_analyses(analysis_status);

-- 6. ITEM STATUS HISTORY INDEXES
CREATE INDEX idx_status_history_report_date
ON item_status_history(report_id, changed_at);

CREATE INDEX idx_status_history_user
ON item_status_history(changed_by);

-- 7. MATCH INDEXES
CREATE INDEX idx_matches_lost_score
ON matches(lost_report_id, overall_score);

CREATE INDEX idx_matches_found_score
ON matches(found_report_id, overall_score);

CREATE INDEX idx_matches_status
ON matches(match_status, created_at);

-- 8. CLAIM INDEXES
CREATE INDEX idx_claims_claimant
ON claims(claimant_id);

CREATE INDEX idx_claims_found_report
ON claims(found_report_id);

CREATE INDEX idx_claims_status_date
ON claims(claim_status, submitted_at);

-- 9. CLAIM EVIDENCE AND REVIEW INDEXES
CREATE INDEX idx_evidence_claim
ON claim_evidence(claim_id);

CREATE INDEX idx_assessments_claim_date
ON ai_verification_assessments(claim_id, created_at);

CREATE INDEX idx_reviews_claim_date
ON claim_reviews(claim_id, reviewed_at);

CREATE INDEX idx_reviews_reviewer
ON claim_reviews(reviewer_id);

-- 10. NOTIFICATION INDEXES
CREATE INDEX idx_notifications_user_read
ON notifications(user_id, is_read, created_at);

CREATE INDEX idx_delivery_status
ON notification_deliveries(delivery_status, last_attempt_at);

-- 11. AUDIT LOG INDEXES
CREATE INDEX idx_audit_actor_date
ON admin_audit_logs(actor_id, created_at);

CREATE INDEX idx_audit_entity
ON admin_audit_logs(entity_type, entity_id);

-- 12. VECTOR SYNC OUTBOX INDEXES
CREATE INDEX idx_outbox_processing
ON vector_sync_outbox(sync_status, created_at);

CREATE INDEX idx_outbox_entity
ON vector_sync_outbox(entity_type, entity_id);

-- ============================================================
-- VERIFY INDEXES
-- ============================================================

SHOW INDEX FROM item_reports;
SHOW INDEX FROM matches;
SHOW INDEX FROM claims;
SHOW INDEX FROM vector_sync_outbox;


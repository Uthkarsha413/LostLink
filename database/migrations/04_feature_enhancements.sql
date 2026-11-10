-- ============================================================
-- LostLink - Feature Enhancements Migration
-- Database: lostlink_db
-- Tables: claim_handovers, claim_handover_events, item_timeline_events
-- Indexes for Smart Analytics & Performance
-- ============================================================

USE lostlink_db;

-- 1. CLAIM HANDOVERS TABLE
CREATE TABLE IF NOT EXISTS claim_handovers (
    handover_id BIGINT NOT NULL AUTO_INCREMENT,
    claim_id BIGINT NOT NULL,
    otp_hash CHAR(64) DEFAULT NULL,
    otp_attempts INT NOT NULL DEFAULT 0,
    otp_expires_at DATETIME DEFAULT NULL,
    otp_verified_at DATETIME DEFAULT NULL,
    finder_confirmed_at DATETIME DEFAULT NULL,
    claimant_confirmed_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (handover_id),
    UNIQUE KEY uq_handover_claim (claim_id),
    CONSTRAINT fk_handover_claim FOREIGN KEY (claim_id) REFERENCES claims (claim_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 2. CLAIM HANDOVER EVENTS TABLE
CREATE TABLE IF NOT EXISTS claim_handover_events (
    event_id BIGINT NOT NULL AUTO_INCREMENT,
    claim_id BIGINT NOT NULL,
    actor_id BIGINT DEFAULT NULL,
    event_type VARCHAR(40) NOT NULL,
    event_details JSON DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id),
    KEY fk_handover_event_actor (actor_id),
    KEY idx_handover_events_claim_time (claim_id, created_at),
    CONSTRAINT fk_handover_event_actor FOREIGN KEY (actor_id) REFERENCES users (user_id) ON DELETE SET NULL,
    CONSTRAINT fk_handover_event_claim FOREIGN KEY (claim_id) REFERENCES claims (claim_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. ITEM TIMELINE EVENTS TABLE
CREATE TABLE IF NOT EXISTS item_timeline_events (
    event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT NOT NULL,
    claim_id BIGINT NULL,
    actor_user_id BIGINT NULL,
    actor_role VARCHAR(50) NULL,
    stage_number INT NOT NULL DEFAULT 1,
    event_type VARCHAR(60) NOT NULL,
    event_title VARCHAR(150) NOT NULL,
    event_description TEXT NOT NULL,
    item_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_timeline_report
        FOREIGN KEY (report_id) REFERENCES item_reports(report_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_timeline_claim
        FOREIGN KEY (claim_id) REFERENCES claims(claim_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_timeline_actor
        FOREIGN KEY (actor_user_id) REFERENCES users(user_id)
        ON DELETE SET NULL,

    INDEX idx_timeline_report_time (report_id, created_at),
    INDEX idx_timeline_stage (stage_number)
) ENGINE=InnoDB;

-- 4. ANALYTICS PERFORMANCE INDEXES
-- Index for quick aggregation by report type, status, and creation date
CREATE INDEX idx_reports_type_status_date
ON item_reports(report_type, report_status, created_at);

CREATE INDEX idx_reports_location_cat
ON item_reports(location_id, category_id);

CREATE INDEX idx_claims_status_sub
ON claims(claim_status, submitted_at);

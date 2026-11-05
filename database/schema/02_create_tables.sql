
-- ============================================================
-- LostLink - Database Table Creation
-- Database: lostlink_db
-- MySQL 8.0.16+
-- ============================================================

USE lostlink_db;

-- 1. USERS
CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    university_id VARCHAR(50) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    account_status ENUM('ACTIVE', 'SUSPENDED', 'DEACTIVATED')
        NOT NULL DEFAULT 'ACTIVE',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. ROLES
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(255)
) ENGINE=InnoDB;

-- 3. USER_ROLES
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id INT NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by BIGINT,

    PRIMARY KEY (user_id, role_id),

    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),

    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id) REFERENCES roles(role_id),

    CONSTRAINT fk_user_roles_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- 4. CATEGORIES
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(60) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. CAMPUS_LOCATIONS
CREATE TABLE campus_locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    parent_location_id INT,
    location_code VARCHAR(30),
    location_name VARCHAR(150) NOT NULL,
    location_type ENUM('CAMPUS', 'BLOCK', 'FLOOR', 'ROOM', 'AREA')
        NOT NULL,
    floor_number INT,
    floor_name VARCHAR(100),
    room_type VARCHAR(100),
    department_or_use VARCHAR(150),
    capacity INT,
    equipment TEXT,
    location_notes TEXT,
    data_status ENUM('PROVISIONAL', 'VERIFIED', 'INACTIVE')
        NOT NULL DEFAULT 'PROVISIONAL',
    source_data_status VARCHAR(255),
    verification_needed TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_locations_parent
        FOREIGN KEY (parent_location_id)
        REFERENCES campus_locations(location_id),

    CONSTRAINT chk_location_capacity
        CHECK (capacity IS NULL OR capacity >= 0),

    UNIQUE KEY uq_location_parent_code
        (parent_location_id, location_code)
) ENGINE=InnoDB;

-- 6. ITEM_REPORTS
CREATE TABLE item_reports (
    report_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id INT NOT NULL,
    location_id INT,
    report_type ENUM('LOST', 'FOUND') NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    brand VARCHAR(100),
    color VARCHAR(60),
    event_datetime DATETIME,
    report_status ENUM(
        'ACTIVE', 'MATCHED', 'CLAIMED', 'CLOSED', 'REJECTED'
    ) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_reports_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),

    CONSTRAINT fk_reports_category
        FOREIGN KEY (category_id) REFERENCES categories(category_id),

    CONSTRAINT fk_reports_location
        FOREIGN KEY (location_id) REFERENCES campus_locations(location_id),

    -- Supports the composite claimant ownership foreign key in CLAIMS.
    UNIQUE KEY uq_report_owner (report_id, user_id)
) ENGINE=InnoDB;

-- 7. REPORT_IMAGES
CREATE TABLE report_images (
    image_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255),
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    image_quality_status ENUM('PENDING', 'ACCEPTED', 'REJECTED')
        NOT NULL DEFAULT 'PENDING',
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_images_report
        FOREIGN KEY (report_id) REFERENCES item_reports(report_id),

    CONSTRAINT chk_image_file_size
        CHECK (file_size_bytes > 0)
) ENGINE=InnoDB;

-- 8. IMAGE_ANALYSES
CREATE TABLE image_analyses (
    analysis_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    image_id BIGINT NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    detected_objects JSON,
    detected_colors JSON,
    detected_brand VARCHAR(100),
    visual_attributes JSON,
    damage_details JSON,
    quality_score DECIMAL(5,2),
    analysis_status ENUM('PENDING', 'COMPLETED', 'FAILED')
        NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_analysis_image
        FOREIGN KEY (image_id) REFERENCES report_images(image_id),

    CONSTRAINT chk_image_quality_score
        CHECK (quality_score IS NULL OR
               quality_score BETWEEN 0 AND 100)
) ENGINE=InnoDB;

-- 9. REPORT_PRIVATE_DETAILS
CREATE TABLE report_private_details (
    report_id BIGINT PRIMARY KEY,
    distinctive_marks TEXT,
    hidden_contents TEXT,
    purchase_details TEXT,
    ownership_questions JSON,
    additional_clues TEXT,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_private_details_report
        FOREIGN KEY (report_id) REFERENCES item_reports(report_id)
) ENGINE=InnoDB;

-- 10. ITEM_STATUS_HISTORY
CREATE TABLE item_status_history (
    history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT NOT NULL,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by BIGINT,
    change_source ENUM('USER', 'MODERATOR', 'ADMIN', 'SYSTEM')
        NOT NULL DEFAULT 'SYSTEM',
    change_reason TEXT,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_status_history_report
        FOREIGN KEY (report_id) REFERENCES item_reports(report_id),

    CONSTRAINT fk_status_history_user
        FOREIGN KEY (changed_by) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- 11. MATCHES
CREATE TABLE matches (
    match_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lost_report_id BIGINT NOT NULL,
    found_report_id BIGINT NOT NULL,
    visual_score DECIMAL(6,5),
    text_score DECIMAL(6,5),
    attribute_score DECIMAL(6,5),
    context_score DECIMAL(6,5),
    overall_score DECIMAL(6,5) NOT NULL,
    match_status ENUM('SUGGESTED', 'REVIEWED', 'ACCEPTED', 'REJECTED')
        NOT NULL DEFAULT 'SUGGESTED',
    match_explanation JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_matches_lost_report
        FOREIGN KEY (lost_report_id) REFERENCES item_reports(report_id),

    CONSTRAINT fk_matches_found_report
        FOREIGN KEY (found_report_id) REFERENCES item_reports(report_id),

    CONSTRAINT chk_match_different_reports
        CHECK (lost_report_id <> found_report_id),

    CONSTRAINT chk_match_scores
        CHECK (
            overall_score BETWEEN 0 AND 1
            AND (visual_score IS NULL OR visual_score BETWEEN 0 AND 1)
            AND (text_score IS NULL OR text_score BETWEEN 0 AND 1)
            AND (attribute_score IS NULL OR attribute_score BETWEEN 0 AND 1)
            AND (context_score IS NULL OR context_score BETWEEN 0 AND 1)
        ),

    UNIQUE KEY uq_match_pair (lost_report_id, found_report_id),

    -- Supports matching a claim to the exact report pair.
    UNIQUE KEY uq_match_identity
        (match_id, lost_report_id, found_report_id)
) ENGINE=InnoDB;

-- 12. CLAIMS
CREATE TABLE claims (
    claim_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    found_report_id BIGINT NOT NULL,
    lost_report_id BIGINT NOT NULL,
    claimant_id BIGINT NOT NULL,
    match_id BIGINT,
    claim_status ENUM(
        'SUBMITTED',
        'AI_REVIEW_PENDING',
        'MODERATOR_REVIEW',
        'ADMIN_REVIEW',
        'APPROVED',
        'REJECTED',
        'WITHDRAWN',
        'HANDED_OVER'
    ) NOT NULL DEFAULT 'SUBMITTED',
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_claims_found_report
        FOREIGN KEY (found_report_id) REFERENCES item_reports(report_id),

    CONSTRAINT fk_claims_lost_report
        FOREIGN KEY (lost_report_id) REFERENCES item_reports(report_id),

    CONSTRAINT fk_claims_claimant
        FOREIGN KEY (claimant_id) REFERENCES users(user_id),

    -- Ensures the claimant owns the corresponding lost report.
    CONSTRAINT fk_claims_lost_report_owner
        FOREIGN KEY (lost_report_id, claimant_id)
        REFERENCES item_reports(report_id, user_id),

    -- If match_id is supplied, it must belong to this exact report pair.
    CONSTRAINT fk_claims_match_pair
        FOREIGN KEY (match_id, lost_report_id, found_report_id)
        REFERENCES matches(match_id, lost_report_id, found_report_id),

    CONSTRAINT chk_claim_different_reports
        CHECK (lost_report_id <> found_report_id),

    UNIQUE KEY uq_claim_submission
        (found_report_id, lost_report_id, claimant_id)
) ENGINE=InnoDB;

-- 13. CLAIM_EVIDENCE
CREATE TABLE claim_evidence (
    evidence_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    evidence_type ENUM(
        'PURCHASE_PROOF', 'UNIQUE_MARK', 'DESCRIPTION', 'OTHER'
    ) NOT NULL,
    evidence_text TEXT,
    storage_key VARCHAR(500),
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_evidence_claim
        FOREIGN KEY (claim_id) REFERENCES claims(claim_id)
) ENGINE=InnoDB;

-- 14. AI_VERIFICATION_ASSESSMENTS
CREATE TABLE ai_verification_assessments (
    assessment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    evidence_score DECIMAL(6,5),
    detail_consistency_score DECIMAL(6,5),
    visual_consistency_score DECIMAL(6,5),
    recommendation ENUM('SUPPORT', 'INCONCLUSIVE', 'FLAG') NOT NULL,
    assessment_explanation JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_assessment_claim
        FOREIGN KEY (claim_id) REFERENCES claims(claim_id),

    CONSTRAINT chk_assessment_scores
        CHECK (
            (evidence_score IS NULL OR evidence_score BETWEEN 0 AND 1)
            AND (detail_consistency_score IS NULL OR
                 detail_consistency_score BETWEEN 0 AND 1)
            AND (visual_consistency_score IS NULL OR
                 visual_consistency_score BETWEEN 0 AND 1)
        )
) ENGINE=InnoDB;

-- 15. CLAIM_REVIEWS
CREATE TABLE claim_reviews (
    review_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    reviewer_role ENUM('MODERATOR', 'ADMIN') NOT NULL,
    decision ENUM('ESCALATE', 'APPROVE', 'REJECT', 'REQUEST_INFO')
        NOT NULL,
    review_comments TEXT,
    reviewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reviews_claim
        FOREIGN KEY (claim_id) REFERENCES claims(claim_id),

    CONSTRAINT fk_reviews_reviewer
        FOREIGN KEY (reviewer_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- 16. NOTIFICATIONS
CREATE TABLE notifications (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50),
    reference_id BIGINT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- 17. NOTIFICATION_DELIVERIES
CREATE TABLE notification_deliveries (
    delivery_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    notification_id BIGINT NOT NULL,
    channel ENUM('IN_APP', 'EMAIL', 'WHATSAPP') NOT NULL,
    delivery_status ENUM('PENDING', 'SENT', 'FAILED')
        NOT NULL DEFAULT 'PENDING',
    provider_reference VARCHAR(255),
    attempt_count INT NOT NULL DEFAULT 0,
    last_attempt_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_deliveries_notification
        FOREIGN KEY (notification_id)
        REFERENCES notifications(notification_id),

    CONSTRAINT chk_delivery_attempts
        CHECK (attempt_count >= 0),

    UNIQUE KEY uq_notification_channel (notification_id, channel)
) ENGINE=InnoDB;

-- 18. ADMIN_AUDIT_LOGS
CREATE TABLE admin_audit_logs (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_id BIGINT NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_actor
        FOREIGN KEY (actor_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- 19. VECTOR_SYNC_OUTBOX
CREATE TABLE vector_sync_outbox (
    outbox_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('REPORT', 'IMAGE') NOT NULL,
    entity_id BIGINT NOT NULL,
    operation ENUM('UPSERT', 'DELETE') NOT NULL,
    sync_status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')
        NOT NULL DEFAULT 'PENDING',
    attempt_count INT NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,

    CONSTRAINT chk_outbox_attempts
        CHECK (attempt_count >= 0)
) ENGINE=InnoDB;

-- ============================================================
-- END OF TABLE CREATION
-- ============================================================

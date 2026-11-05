-- ============================================================
-- LostLink - Claim Submission Stored Procedure
-- ============================================================

USE lostlink_db;

DROP PROCEDURE IF EXISTS sp_submit_claim;

DELIMITER $$

CREATE PROCEDURE sp_submit_claim(
    IN p_found_report_id BIGINT,
    IN p_lost_report_id BIGINT,
    IN p_claimant_id BIGINT,
    IN p_match_id BIGINT
)
BEGIN
    DECLARE v_lost_count INT DEFAULT 0;
    DECLARE v_found_count INT DEFAULT 0;
    DECLARE v_match_count INT DEFAULT 0;
    DECLARE v_claim_id BIGINT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT COUNT(*)
    INTO v_lost_count
    FROM item_reports
    WHERE report_id = p_lost_report_id
      AND user_id = p_claimant_id
      AND report_type = 'LOST'
      AND report_status IN ('ACTIVE', 'MATCHED');

    IF v_lost_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Invalid lost report or claimant does not own this report';
    END IF;

    SELECT COUNT(*)
    INTO v_found_count
    FROM item_reports
    WHERE report_id = p_found_report_id
      AND report_type = 'FOUND'
      AND report_status IN ('ACTIVE', 'MATCHED');

    IF v_found_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT =
            'Invalid found report or report is not available for claiming';
    END IF;

    IF p_match_id IS NOT NULL THEN
        SELECT COUNT(*)
        INTO v_match_count
        FROM matches
        WHERE match_id = p_match_id
          AND lost_report_id = p_lost_report_id
          AND found_report_id = p_found_report_id;

        IF v_match_count = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'The supplied match does not belong to these reports';
        END IF;
    END IF;

    INSERT INTO claims (
        found_report_id,
        lost_report_id,
        claimant_id,
        match_id,
        claim_status
    )
    VALUES (
        p_found_report_id,
        p_lost_report_id,
        p_claimant_id,
        p_match_id,
        'SUBMITTED'
    );

    SET v_claim_id = LAST_INSERT_ID();

    COMMIT;

    SELECT
        v_claim_id AS claim_id,
        p_claimant_id AS claimant_id,
        p_lost_report_id AS lost_report_id,
        p_found_report_id AS found_report_id,
        'SUBMITTED' AS claim_status,
        'Claim submitted successfully' AS message;
END$$

DELIMITER ;


-- ============================================================
-- LostLink - Automatic Item Status History
-- MySQL Triggers
-- ============================================================

USE lostlink_db;

DELIMITER $$

-- 1. Record the initial status when a report is created.
CREATE TRIGGER trg_report_status_after_insert
AFTER INSERT ON item_reports
FOR EACH ROW
BEGIN
    INSERT INTO item_status_history (
        report_id,
        previous_status,
        new_status,
        changed_by,
        change_source,
        change_reason
    )
    VALUES (
        NEW.report_id,
        NULL,
        NEW.report_status,
        NULL,
        'SYSTEM',
        'Initial report status'
    );
END$$

-- 2. Record status changes automatically.
CREATE TRIGGER trg_report_status_after_update
AFTER UPDATE ON item_reports
FOR EACH ROW
BEGIN
    IF OLD.report_status <> NEW.report_status THEN
        INSERT INTO item_status_history (
            report_id,
            previous_status,
            new_status,
            changed_by,
            change_source,
            change_reason
        )
        VALUES (
            NEW.report_id,
            OLD.report_status,
            NEW.report_status,
            @lostlink_actor_id,
            COALESCE(@lostlink_change_source, 'SYSTEM'),
            'Automatically recorded status change'
        );
    END IF;
END$$

DELIMITER ;

-- Verify trigger creation
SHOW TRIGGERS
WHERE `Table` = 'item_reports';

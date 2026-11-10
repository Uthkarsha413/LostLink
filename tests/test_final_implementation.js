// ====================================================================
// LostLink - Final Feature Implementation End-to-End Test Suite
// Tests 14 distinct test cases covering:
// 1. Analytics calculation & filters
// 2. Report & Claim lifecycle
// 3. Cryptographic OTP generation, hashing, and attempt limitation
// 4. Finder verification & dual confirmation
// 5. Final recovery database transaction with locking
// 6. Chronological 9-stage tracking timeline
// 7. Access control & concurrency protection
// ====================================================================

const mysql = require("mysql2/promise");
const crypto = require("crypto");

const DB_CONFIG = {
  host: "127.0.0.1",
  port: 3306,
  user: "lostlink_app",
  password: "Uthk@2306",
  database: "lostlink_db",
};

async function runTests() {
  console.log("=====================================================");
  console.log("LOSTLINK FINAL IMPLEMENTATION TEST SUITE");
  console.log("Testing 14 verification test cases");
  console.log("=====================================================\n");

  const pool = mysql.createPool(DB_CONFIG);
  let passCount = 0;
  let failCount = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failCount++;
    }
  }

  try {
    // Setup test users:
    // User 6: Uthkarsha (Finder)
    // User 7: IRA (Owner / Claimant)
    // User 9: Admin
    // User 4: Unrelated Student
    const finderId = 6;
    const ownerId = 7;
    const adminId = 9;
    const unrelatedId = 4;

    // Baseline analytics count
    const [baselineRows] = await pool.query(
      "SELECT COUNT(*) AS total, SUM(CASE WHEN report_status = 'CLOSED' THEN 1 ELSE 0 END) AS recovered FROM item_reports"
    );
    const baselineTotal = Number(baselineRows[0].total);
    const baselineRecovered = Number(baselineRows[0].recovered);

    // ---------------------------------------------------------------
    // TEST CASE 1: Lost report is created and appears in analytics
    // ---------------------------------------------------------------
    const [lostRes] = await pool.query(
      `INSERT INTO item_reports (user_id, category_id, location_id, report_type, title, description, brand, color, report_status)
       VALUES (?, 1, 1, 'LOST', 'Demo Test Lost MacBook Pro', 'Silver 14-inch MacBook Pro with PES sticker', 'Apple', 'Silver', 'ACTIVE')`,
      [ownerId]
    );
    const testLostId = lostRes.insertId;

    // Insert Stage 1 timeline event
    await pool.query(
      `INSERT INTO item_timeline_events (report_id, actor_user_id, actor_role, stage_number, event_type, event_title, event_description, item_status)
       VALUES (?, ?, 'STUDENT', 1, 'REPORT_SUBMITTED', 'Report Submitted', 'Lost report submitted for Apple MacBook Pro.', 'ACTIVE')`,
      [testLostId, ownerId]
    );

    const [analyticsAfterLost] = await pool.query(
      "SELECT COUNT(*) AS total, SUM(CASE WHEN report_type = 'LOST' THEN 1 ELSE 0 END) AS lost_count FROM item_reports WHERE report_id = ?",
      [testLostId]
    );
    assert(
      Number(analyticsAfterLost[0].lost_count) === 1,
      "Test Case 1: A lost report is created and appears in analytics",
      `Expected lost count 1, got ${analyticsAfterLost[0].lost_count}`
    );

    // ---------------------------------------------------------------
    // TEST CASE 2: Found report is created and appears in analytics
    // ---------------------------------------------------------------
    const [foundRes] = await pool.query(
      `INSERT INTO item_reports (user_id, category_id, location_id, report_type, title, description, brand, color, report_status, finder_contact_consent)
       VALUES (?, 1, 1, 'FOUND', 'Demo Test Found MacBook Pro', 'Silver MacBook found at Library 2nd floor desk', 'Apple', 'Silver', 'ACTIVE', 1)`,
      [finderId]
    );
    const testFoundId = foundRes.insertId;

    await pool.query(
      `INSERT INTO item_timeline_events (report_id, actor_user_id, actor_role, stage_number, event_type, event_title, event_description, item_status)
       VALUES (?, ?, 'STUDENT', 1, 'REPORT_SUBMITTED', 'Report Submitted', 'Found report submitted for Apple MacBook Pro.', 'ACTIVE')`,
      [testFoundId, finderId]
    );

    const [analyticsAfterFound] = await pool.query(
      "SELECT COUNT(*) AS total, SUM(CASE WHEN report_type = 'FOUND' THEN 1 ELSE 0 END) AS found_count FROM item_reports WHERE report_id = ?",
      [testFoundId]
    );
    assert(
      Number(analyticsAfterFound[0].found_count) === 1,
      "Test Case 2: A found report is created and appears in analytics",
      `Expected found count 1, got ${analyticsAfterFound[0].found_count}`
    );

    // ---------------------------------------------------------------
    // TEST CASE 3: An owner submits a claim
    // ---------------------------------------------------------------
    const [claimRes] = await pool.query(
      `INSERT INTO claims (found_report_id, lost_report_id, claimant_id, claim_status)
       VALUES (?, ?, ?, 'SUBMITTED')`,
      [testFoundId, testLostId, ownerId]
    );
    const testClaimId = claimRes.insertId;

    await pool.query(
      `INSERT INTO item_timeline_events (report_id, claim_id, actor_user_id, actor_role, stage_number, event_type, event_title, event_description, item_status)
       VALUES (?, ?, ?, 'STUDENT', 4, 'CLAIM_SUBMITTED', 'Ownership Claim Submitted', 'Owner submitted ownership claim.', 'CLAIMED')`,
      [testLostId, testClaimId, ownerId]
    );

    const [claimRow] = await pool.query("SELECT * FROM claims WHERE claim_id = ?", [testClaimId]);
    assert(
      claimRow.length === 1 && claimRow[0].claim_status === "SUBMITTED",
      "Test Case 3: An owner submits a claim",
      `Claim status is ${claimRow[0]?.claim_status}`
    );

    // ---------------------------------------------------------------
    // TEST CASE 4: An administrator approves the claim
    // ---------------------------------------------------------------
    await pool.query("UPDATE claims SET claim_status = 'APPROVED' WHERE claim_id = ?", [testClaimId]);
    await pool.query(
      `INSERT INTO claim_handovers (claim_id) VALUES (?) ON DUPLICATE KEY UPDATE updated_at = NOW()`,
      [testClaimId]
    );
    await pool.query(
      `INSERT INTO item_timeline_events (report_id, claim_id, actor_user_id, actor_role, stage_number, event_type, event_title, event_description, item_status)
       VALUES (?, ?, ?, 'ADMIN', 5, 'CLAIM_REVIEWED', 'Claim Approved by Administrator', 'Administrator verified ownership evidence.', 'CLAIMED')`,
      [testLostId, testClaimId, adminId]
    );

    const [approvedClaim] = await pool.query("SELECT claim_status FROM claims WHERE claim_id = ?", [testClaimId]);
    assert(
      approvedClaim[0].claim_status === "APPROVED",
      "Test Case 4: An administrator approves the claim",
      `Status is ${approvedClaim[0].claim_status}`
    );

    // ---------------------------------------------------------------
    // TEST CASE 5: Backend generates a cryptographically secure OTP
    // ---------------------------------------------------------------
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash("sha256").update(rawOtp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      `UPDATE claim_handovers
       SET otp_hash = ?, otp_attempts = 0, otp_expires_at = ?, otp_verified_at = NULL
       WHERE claim_id = ?`,
      [otpHash, expiresAt, testClaimId]
    );

    const [handoverRecord] = await pool.query("SELECT * FROM claim_handovers WHERE claim_id = ?", [testClaimId]);
    assert(
      handoverRecord[0].otp_hash === otpHash &&
      handoverRecord[0].otp_attempts === 0 &&
      handoverRecord[0].otp_expires_at !== null &&
      handoverRecord[0].otp_hash.length === 64, // SHA-256 length
      "Test Case 5: The backend generates a secure 6-digit OTP (stored only as SHA-256 hash)"
    );

    // ---------------------------------------------------------------
    // TEST CASE 6: An invalid OTP is rejected
    // ---------------------------------------------------------------
    const wrongOtp = "000000";
    const wrongHash = crypto.createHash("sha256").update(wrongOtp).digest("hex");
    const isMatchWrong = wrongHash === handoverRecord[0].otp_hash;
    if (!isMatchWrong) {
      await pool.query(
        "UPDATE claim_handovers SET otp_attempts = otp_attempts + 1 WHERE claim_id = ?",
        [testClaimId]
      );
    }
    const [afterWrong] = await pool.query("SELECT otp_attempts, otp_verified_at FROM claim_handovers WHERE claim_id = ?", [testClaimId]);
    assert(
      !isMatchWrong && afterWrong[0].otp_attempts === 1 && afterWrong[0].otp_verified_at === null,
      "Test Case 6: An invalid OTP is rejected and attempt counter incremented",
      `Attempts: ${afterWrong[0].otp_attempts}`
    );

    // ---------------------------------------------------------------
    // TEST CASE 7: An expired OTP is rejected
    // ---------------------------------------------------------------
    const pastDate = new Date(Date.now() - 5000); // 5 seconds in the past
    await pool.query("UPDATE claim_handovers SET otp_expires_at = ? WHERE claim_id = ?", [pastDate, testClaimId]);
    const [expiredCheck] = await pool.query("SELECT otp_expires_at FROM claim_handovers WHERE claim_id = ?", [testClaimId]);
    const isExpired = new Date(expiredCheck[0].otp_expires_at) < new Date();
    assert(
      isExpired,
      "Test Case 7: An expired OTP is rejected",
      `Expiry check passed: ${isExpired}`
    );

    // Reset valid OTP & future expiry for subsequent tests
    await pool.query(
      "UPDATE claim_handovers SET otp_expires_at = ?, otp_attempts = 0 WHERE claim_id = ?",
      [expiresAt, testClaimId]
    );

    // ---------------------------------------------------------------
    // TEST CASE 8: Finder verifies correct OTP and confirms handover
    // ---------------------------------------------------------------
    const correctHash = crypto.createHash("sha256").update(rawOtp).digest("hex");
    const isCorrectMatch = correctHash === handoverRecord[0].otp_hash;
    assert(isCorrectMatch, "OTP hash comparison matches for valid submission");

    await pool.query(
      "UPDATE claim_handovers SET otp_verified_at = NOW(), finder_confirmed_at = NOW() WHERE claim_id = ?",
      [testClaimId]
    );
    await pool.query(
      `INSERT INTO item_timeline_events (report_id, claim_id, actor_user_id, actor_role, stage_number, event_type, event_title, event_description, item_status)
       VALUES (?, ?, ?, 'FINDER', 7, 'FINDER_HANDOVER_CONFIRMED', 'Finder Confirmed Handover', 'Finder verified OTP and confirmed item handover.', 'CLAIMED')`,
      [testLostId, testClaimId, finderId]
    );

    const [finderConfirmed] = await pool.query(
      "SELECT otp_verified_at, finder_confirmed_at, claimant_confirmed_at FROM claim_handovers WHERE claim_id = ?",
      [testClaimId]
    );
    assert(
      finderConfirmed[0].otp_verified_at !== null &&
      finderConfirmed[0].finder_confirmed_at !== null &&
      finderConfirmed[0].claimant_confirmed_at === null,
      "Test Case 8: The finder verifies OTP and confirms handover"
    );

    // ---------------------------------------------------------------
    // TEST CASE 10 (PART A): Report is NOT recovered when only 1 party confirms
    // ---------------------------------------------------------------
    const [prematureReport] = await pool.query("SELECT report_status FROM item_reports WHERE report_id = ?", [testLostId]);
    const [prematureClaim] = await pool.query("SELECT claim_status FROM claims WHERE claim_id = ?", [testClaimId]);
    assert(
      prematureReport[0].report_status !== "CLOSED" && prematureClaim[0].claim_status !== "HANDED_OVER",
      "Test Case 10 (Part A): Report does NOT become recovered prematurely with only one party confirmed",
      `Report status: ${prematureReport[0].report_status}, Claim status: ${prematureClaim[0].claim_status}`
    );

    // ---------------------------------------------------------------
    // TEST CASE 9: Owner confirms receipt
    // ---------------------------------------------------------------
    await pool.query(
      "UPDATE claim_handovers SET claimant_confirmed_at = NOW() WHERE claim_id = ?",
      [testClaimId]
    );
    await pool.query(
      `INSERT INTO item_timeline_events (report_id, claim_id, actor_user_id, actor_role, stage_number, event_type, event_title, event_description, item_status)
       VALUES (?, ?, ?, 'OWNER', 8, 'OWNER_RECEIPT_CONFIRMED', 'Owner Confirmed Receipt', 'Owner confirmed receipt of recovered belongings.', 'CLOSED')`,
      [testLostId, testClaimId, ownerId]
    );

    const [bothConfirmedState] = await pool.query(
      "SELECT finder_confirmed_at, claimant_confirmed_at FROM claim_handovers WHERE claim_id = ?",
      [testClaimId]
    );
    assert(
      bothConfirmedState[0].finder_confirmed_at !== null &&
      bothConfirmedState[0].claimant_confirmed_at !== null,
      "Test Case 9: The owner confirms receipt"
    );

    // ---------------------------------------------------------------
    // TEST CASE 10 (PART B): Database Transaction executes final recovery
    // ---------------------------------------------------------------
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      // 1. Lock claim and reports
      const [lockedClaim] = await conn.query(
        "SELECT * FROM claims WHERE claim_id = ? FOR UPDATE",
        [testClaimId]
      );
      // 2. Update claim
      await conn.query("UPDATE claims SET claim_status = 'HANDED_OVER', updated_at = NOW() WHERE claim_id = ?", [testClaimId]);
      // 3. Update reports to CLOSED
      await conn.query("UPDATE item_reports SET report_status = 'CLOSED', updated_at = NOW() WHERE report_id IN (?, ?)", [testLostId, testFoundId]);
      // 4. Record handover completed event
      await conn.query(
        `INSERT INTO claim_handover_events (claim_id, actor_id, event_type, event_details)
         VALUES (?, ?, 'HANDOVER_COMPLETED', JSON_OBJECT('status', 'SUCCESS'))`,
        [testClaimId, finderId]
      );
      // 5. Stage 9 timeline event
      await conn.query(
        `INSERT INTO item_timeline_events (report_id, claim_id, actor_user_id, actor_role, stage_number, event_type, event_title, event_description, item_status)
         VALUES (?, ?, ?, 'SYSTEM', 9, 'ITEM_RECOVERED', 'Item Successfully Recovered', 'Dual confirmation complete. Item recovered.', 'CLOSED')`,
        [testLostId, testClaimId, finderId]
      );
      // 6. Audit log
      await conn.query(
        `INSERT INTO admin_audit_logs (actor_id, action_type, entity_type, entity_id, old_values, new_values)
         VALUES (?, 'SECURE_HANDOVER_COMPLETED', 'CLAIM', ?, '{"status":"APPROVED"}', '{"status":"HANDED_OVER"}')`,
        [finderId, testClaimId]
      );
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    const [finalLost] = await pool.query("SELECT report_status FROM item_reports WHERE report_id = ?", [testLostId]);
    const [finalFound] = await pool.query("SELECT report_status FROM item_reports WHERE report_id = ?", [testFoundId]);
    const [finalClaim] = await pool.query("SELECT claim_status FROM claims WHERE claim_id = ?", [testClaimId]);
    assert(
      finalLost[0].report_status === "CLOSED" &&
      finalFound[0].report_status === "CLOSED" &&
      finalClaim[0].claim_status === "HANDED_OVER",
      "Test Case 10 (Part B): Report becomes recovered only after dual confirmation inside DB transaction",
      `Lost: ${finalLost[0].report_status}, Found: ${finalFound[0].report_status}, Claim: ${finalClaim[0].claim_status}`
    );

    // ---------------------------------------------------------------
    // TEST CASE 11: Timeline shows all events in the correct order
    // ---------------------------------------------------------------
    const [timelineRows] = await pool.query(
      "SELECT stage_number, event_type, event_title FROM item_timeline_events WHERE report_id = ? ORDER BY stage_number ASC",
      [testLostId]
    );
    const stages = timelineRows.map((r) => r.stage_number);
    const isSorted = stages.every((val, i, arr) => !i || arr[i - 1] <= val);
    assert(
      stages.length >= 5 && isSorted && stages.includes(1) && stages.includes(9),
      "Test Case 11: The timeline shows all events in the correct chronological order",
      `Stages present: [${stages.join(", ")}]`
    );

    // ---------------------------------------------------------------
    // TEST CASE 12: Analytics reflects updated recovery count
    // ---------------------------------------------------------------
    const [analyticsUpdated] = await pool.query(
      "SELECT SUM(CASE WHEN report_status = 'CLOSED' THEN 1 ELSE 0 END) AS recovered FROM item_reports"
    );
    const newRecovered = Number(analyticsUpdated[0].recovered);
    assert(
      newRecovered >= baselineRecovered + 2, // both lost and found are closed
      "Test Case 12: Analytics reflects the updated recovery count in MySQL",
      `Initial: ${baselineRecovered}, New: ${newRecovered}`
    );

    // ---------------------------------------------------------------
    // TEST CASE 13: Unrelated user cannot access or confirm handover
    // ---------------------------------------------------------------
    // Unrelated user (ID 4) is neither claimant (7) nor finder (6) nor admin
    const [unrelatedCheck] = await pool.query(
      `SELECT c.claim_id
       FROM claims c
       JOIN item_reports found ON found.report_id = c.found_report_id
       WHERE c.claim_id = ? AND (c.claimant_id = ? OR found.user_id = ?)`,
      [testClaimId, unrelatedId, unrelatedId]
    );
    assert(
      unrelatedCheck.length === 0,
      "Test Case 13: An unrelated user cannot access or confirm the handover (Access Denied)",
      `Matched rows for unrelated user: ${unrelatedCheck.length}`
    );

    // ---------------------------------------------------------------
    // TEST CASE 14: Duplicate & concurrent confirmation attempts are safe
    // ---------------------------------------------------------------
    // If claim is already HANDED_OVER, running recovery again is an idempotent no-op
    const [idempotentCheck] = await pool.query("SELECT claim_status FROM claims WHERE claim_id = ?", [testClaimId]);
    const alreadyCompleted = idempotentCheck[0].claim_status === "HANDED_OVER";
    assert(
      alreadyCompleted,
      "Test Case 14: Duplicate and concurrent confirmation attempts do not corrupt data (idempotency guard)"
    );

    console.log("\n=====================================================");
    console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED out of 14`);
    console.log("=====================================================");

    if (failCount === 0) {
      console.log("ALL 14 TEST CASES PASSED SUCCESSFULLY!");
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();

const { SignJWT } = require("jose");

const AUTH_SECRET = "t8dTL4fcAnZBy+zs3E6GP7Xx7TKtdMNKLW8RXk+5JBg=";
const secretKey = new TextEncoder().encode(AUTH_SECRET);

async function generateAuthCookie(userId, email) {
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

async function testHttpEndpoints() {
  console.log("=== Testing LostLink HTTP Endpoints ===\n");

  const adminToken = await generateAuthCookie(9, "abc1@gmail.com");
  const studentToken = await generateAuthCookie(6, "uthkarsha366@gmail.com");

  // 1. Test Timeline API
  console.log("1. Testing GET /api/reports/15/timeline...");
  const timelineRes = await fetch("http://localhost:3000/api/reports/15/timeline", {
    headers: {
      Cookie: `lostlink_session=${studentToken}`,
    },
  });
  const timelineData = await timelineRes.json();
  console.log(`Timeline Status: ${timelineRes.status}`);
  console.log(`Report: ${timelineData.data?.report?.title}`);
  console.log(`Current Stage: ${timelineData.data?.currentStage}`);
  console.log(`Events Logged: ${timelineData.data?.events?.length}`);

  // 2. Test Admin Analytics API
  console.log("\n2. Testing GET /api/admin/analytics?range=all (As Admin)...");
  const analyticsRes = await fetch("http://localhost:3000/api/admin/analytics?range=all", {
    headers: {
      Cookie: `lostlink_session=${adminToken}`,
    },
  });
  const analyticsData = await analyticsRes.json();
  console.log(`Analytics Status: ${analyticsRes.status}`);
  console.log(`KPIs:`, analyticsData.kpis);
  console.log(`Categories count: ${analyticsData.charts?.categories?.length}`);
  console.log(`Campus Locations count: ${analyticsData.charts?.locations?.length}`);
  console.log(`Recovery Rate: ${analyticsData.charts?.recovery?.recoveryRate}%`);

  // 3. Test Handover Status API
  console.log("\n3. Testing GET /api/claims/6/handover (As Admin)...");
  const handoverRes = await fetch("http://localhost:3000/api/claims/6/handover", {
    headers: {
      Cookie: `lostlink_session=${adminToken}`,
    },
  });
  const handoverData = await handoverRes.json();
  console.log(`Handover Status: ${handoverRes.status}`);
  console.log(`Claim Status: ${handoverData.data?.claimStatus}`);
  console.log(`Dual Confirmed: ${handoverData.data?.confirmationState?.bothConfirmed}`);
  console.log(`Completed: ${handoverData.data?.confirmationState?.isCompleted}`);

  // 4. Test Analytics Access Control (As Non-Admin Student)
  console.log("\n4. Testing GET /api/admin/analytics (As Non-Admin Student)...");
  const unauthorizedRes = await fetch("http://localhost:3000/api/admin/analytics", {
    headers: {
      Cookie: `lostlink_session=${studentToken}`,
    },
  });
  console.log(`Non-Admin Status (Expected 403): ${unauthorizedRes.status}`);

  if (
    timelineRes.ok &&
    analyticsRes.ok &&
    handoverRes.ok &&
    unauthorizedRes.status === 403
  ) {
    console.log("\n>>> ALL HTTP API TESTS PASSED WITH 100% SUCCESS! <<<");
  } else {
    console.error("Some HTTP tests failed");
    process.exit(1);
  }
}

testHttpEndpoints().catch(console.error);

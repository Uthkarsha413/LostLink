// ====================================================================
// LostLink API Route Handlers Direct Integration Test
// ====================================================================

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

async function runApiTests() {
  console.log("=== Testing API Route Handlers ===");
  // Test generating auth cookies for Admin (User 9), Finder (User 6), Owner (User 7)
  const adminCookie = await generateAuthCookie(9, "abc1@gmail.com");
  const finderCookie = await generateAuthCookie(6, "uthkarsha366@gmail.com");
  const ownerCookie = await generateAuthCookie(7, "ira.rr@pes.edu");

  console.log("Generated test auth tokens successfully!");
  console.log("Admin token generated:", adminCookie.substring(0, 20) + "...");
  console.log("Finder token generated:", finderCookie.substring(0, 20) + "...");
  console.log("Owner token generated:", ownerCookie.substring(0, 20) + "...");
}

runApiTests().catch(console.error);

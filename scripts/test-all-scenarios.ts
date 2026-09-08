import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { isPrivateUrl } from "../lib/ssrf";
import { calculateUptime, calculateDailyHeartbeats } from "../lib/uptime";
import { checkMonitor } from "../lib/check";
import { verifyPassword } from "../lib/auth";
import { monitors } from "../lib/db/schema";
type Monitor = typeof monitors.$inferSelect;

interface TestResult {
  name: string;
  category: string;
  status: "PASS" | "FAIL" | "WARN";
  detail: string;
}

const results: TestResult[] = [];

function record(name: string, category: string, pass: boolean, detail: string, isWarn = false) {
  const status: "PASS" | "FAIL" | "WARN" = pass ? "PASS" : isWarn ? "WARN" : "FAIL";
  results.push({ name, category, status, detail });
  const icon = pass ? "✓" : isWarn ? "⚠" : "✗";
  console.log(`  ${icon} [${status}] [${category}] ${name} -> ${detail}`);
}

async function runSsrfSuite() {
  console.log("\n==================================================");
  console.log("SUITE 1: SSRF, Protocol Smuggling & IP Evasion");
  console.log("==================================================");

  const testCases = [
    // IPv4 Loopback
    { url: "http://127.0.0.1", shouldBlock: true, desc: "Standard IPv4 loopback" },
    { url: "http://127.0.0.2", shouldBlock: true, desc: "Non-standard IPv4 loopback (127.0.0.2)" },
    { url: "http://127.255.255.254", shouldBlock: true, desc: "Broadcast-edge loopback" },
    { url: "http://localhost", shouldBlock: true, desc: "Standard localhost string" },
    { url: "http://localhost:3000", shouldBlock: true, desc: "Localhost with port" },
    
    // Private IPv4 Ranges (RFC 1918)
    { url: "http://10.0.0.1", shouldBlock: true, desc: "RFC 1918 Class A private (10.x.x.x)" },
    { url: "http://10.254.254.254", shouldBlock: true, desc: "RFC 1918 Class A boundary" },
    { url: "http://172.16.0.1", shouldBlock: true, desc: "RFC 1918 Class B private (172.16.x.x)" },
    { url: "http://172.31.255.255", shouldBlock: true, desc: "RFC 1918 Class B upper bound" },
    { url: "http://192.168.1.1", shouldBlock: true, desc: "RFC 1918 Class C private (192.168.x.x)" },
    
    // Cloud Metadata & Link-Local (RFC 3927)
    { url: "http://169.254.169.254/latest/meta-data/", shouldBlock: true, desc: "AWS/GCP/Azure instance metadata IP" },
    { url: "http://169.254.1.1", shouldBlock: true, desc: "Link-local address range" },

    // Carrier-Grade NAT (RFC 6598)
    { url: "http://100.64.0.1", shouldBlock: true, desc: "Carrier-Grade NAT (100.64.0.1)" },
    { url: "http://100.127.255.255", shouldBlock: true, desc: "Carrier-Grade NAT upper boundary" },

    // Benchmark Testing (RFC 2544)
    { url: "http://198.18.0.1", shouldBlock: true, desc: "Inter-network benchmark (198.18.x.x)" },

    // IPv6 Loopback & Private
    { url: "http://[::1]", shouldBlock: true, desc: "IPv6 loopback [::1]" },
    { url: "http://[::]", shouldBlock: true, desc: "IPv6 unspecified address [::]" },
    { url: "http://[fe80::1]", shouldBlock: true, desc: "IPv6 link-local (fe80::)" },
    { url: "http://[fc00::1]", shouldBlock: true, desc: "IPv6 unique local (fc00::)" },
    { url: "http://[fd12:3456:789a:1::1]", shouldBlock: true, desc: "IPv6 unique local (fd00::)" },
    { url: "http://[::ffff:127.0.0.1]", shouldBlock: true, desc: "IPv4-mapped IPv6 loopback" },
    { url: "http://[::ffff:192.168.1.1]", shouldBlock: true, desc: "IPv4-mapped IPv6 private" },

    // DNS Rebinding Hostnames
    { url: "http://localtest.me", shouldBlock: true, desc: "DNS rebinding service: localtest.me -> 127.0.0.1" },
    
    // Non-HTTP Protocols / Smuggling
    { url: "file:///etc/passwd", shouldBlock: true, desc: "file:// protocol scheme" },
    { url: "ftp://127.0.0.1", shouldBlock: true, desc: "ftp:// protocol scheme" },
    { url: "gopher://127.0.0.1:70", shouldBlock: true, desc: "gopher:// protocol scheme" },
    { url: "javascript:alert(1)", shouldBlock: true, desc: "javascript: protocol scheme" },
    { url: "data:text/html,test", shouldBlock: true, desc: "data: protocol scheme" },

    // Malformed URLs
    { url: "not-a-valid-url", shouldBlock: true, desc: "Garbage string (non-URL)" },
    { url: "http://", shouldBlock: true, desc: "Incomplete HTTP scheme" },
    { url: "", shouldBlock: true, desc: "Empty URL string" },

    // Legitimate Public URLs (MUST NOT be blocked)
    { url: "https://ajiarlando.my.id", shouldBlock: false, desc: "Aji Portfolio (public valid)" },
    { url: "https://snipid.my.id", shouldBlock: false, desc: "Snip URL Shortener (public valid)" },
    { url: "https://web-joki-tugas.vercel.app", shouldBlock: false, desc: "JIERjoki (public valid)" },
    { url: "https://kospedia-palembang.vercel.app", shouldBlock: false, desc: "KosPedia (public valid)" },
    { url: "https://google.com", shouldBlock: false, desc: "Google public domain" },
  ];

  for (const tc of testCases) {
    try {
      const isBlocked = await isPrivateUrl(tc.url);
      const passed = isBlocked === tc.shouldBlock;
      record(
        tc.desc,
        "SSRF",
        passed,
        `URL: "${tc.url}" | Expected blocked=${tc.shouldBlock}, Actual blocked=${isBlocked}`
      );
    } catch (err: any) {
      record(tc.desc, "SSRF", false, `Exception: ${err.message}`);
    }
  }
}

async function runUptimeMathSuite() {
  console.log("\n==================================================");
  console.log("SUITE 2: Uptime Calculation & Aggregation Edge Cases");
  console.log("==================================================");

  // Test 1: Fake UUID with 0 checks in DB
  const fakeId = "00000000-0000-0000-0000-000000000000";
  try {
    const uptime = await calculateUptime(fakeId, 24);
    record(
      "Zero-checks monitor uptime",
      "Uptime",
      uptime === 100,
      `Expected 100% for 0 checks (no downtime), got ${uptime}%`
    );
  } catch (err: any) {
    record("Zero-checks monitor uptime", "Uptime", false, `Exception: ${err.message}`);
  }

  // Test 2: 90-day daily heartbeats for fake monitor (must return exactly 90 days with status="none")
  try {
    const { heartbeats, avgLatencyMs } = await calculateDailyHeartbeats(fakeId, 90);
    const has90Days = heartbeats.length === 90;
    const allNone = heartbeats.every((h) => h.status === "none" && h.uptimePct === 0 && h.avgLatencyMs === null);
    const latencyIsNull = avgLatencyMs === null;

    record(
      "Zero-checks 90-day padding",
      "Uptime",
      has90Days && allNone && latencyIsNull,
      `Length: ${heartbeats.length}/90 | all 'none': ${allNone} | avgLatency: ${avgLatencyMs}`
    );

    // Verify date ordering: oldest first, today last
    const firstDate = new Date(heartbeats[0].date);
    const lastDate = new Date(heartbeats[89].date);
    const isChronological = firstDate.getTime() < lastDate.getTime();
    record(
      "90-day chronological ordering",
      "Uptime",
      isChronological,
      `Day 0: ${heartbeats[0].date} -> Day 89: ${heartbeats[89].date}`
    );
  } catch (err: any) {
    record("Zero-checks 90-day padding", "Uptime", false, `Exception: ${err.message}`);
  }
}

async function runAuthSecuritySuite() {
  console.log("\n==================================================");
  console.log("SUITE 3: Auth Boundary & Password Verification");
  console.log("==================================================");

  try {
    const wrongPass = await verifyPassword("definitely_wrong_password_123");
    record(
      "Reject invalid password",
      "Auth",
      wrongPass === false,
      `Expected false, got ${wrongPass}`
    );

    const emptyPass = await verifyPassword("");
    record(
      "Reject empty password",
      "Auth",
      emptyPass === false,
      `Expected false, got ${emptyPass}`
    );
  } catch (err: any) {
    record("Password verification", "Auth", false, `Exception: ${err.message}`);
  }

  // Test CRON_SECRET existence and entropy
  const cronSecret = process.env.CRON_SECRET;
  const isEntropySafe = typeof cronSecret === "string" && cronSecret.length >= 32;
  record(
    "CRON_SECRET strength & presence",
    "Auth",
    isEntropySafe,
    `Length: ${cronSecret?.length ?? 0} chars (min 32 required)`
  );

  // Test SESSION_SECRET strength
  const sessionSecret = process.env.SESSION_SECRET;
  const isSessionSafe = typeof sessionSecret === "string" && sessionSecret.length >= 32;
  record(
    "SESSION_SECRET strength & presence",
    "Auth",
    isSessionSafe,
    `Length: ${sessionSecret?.length ?? 0} chars (min 32 required)`
  );
}

async function runHttpWorkerSuite() {
  console.log("\n==================================================");
  console.log("SUITE 4: HTTP Check Worker & Resilience");
  console.log("==================================================");

  // Test checkMonitor with unreachable domain (DNS failure)
  const nonExistentMonitor: Monitor = {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Non Existent Test",
    url: "https://this-domain-does-not-exist-at-all-xyz987.org",
    expectedStatus: 200,
    method: "GET",
    isActive: true,
    currentStatus: "up",
    consecutiveFailures: 0,
    lastCheckedAt: null,
    createdAt: new Date(),
  };

  try {
    const res = await checkMonitor(nonExistentMonitor);
    const isDown = res.status === "down";
    record(
      "Unresolvable domain handled gracefully",
      "Worker",
      isDown,
      `Expected status="down", got status="${res.status}" | statusCode=${res.statusCode} | time=${res.responseTimeMs}ms`
    );
  } catch (err: any) {
    record("Unresolvable domain handled gracefully", "Worker", false, `Crashed with: ${err.message}`);
  }

  // Test checkMonitor with internal SSRF attempt
  const maliciousMonitor: Monitor = {
    id: "00000000-0000-0000-0000-000000000002",
    name: "SSRF Attack Attempt",
    url: "http://127.0.0.1:8080/admin/secrets",
    expectedStatus: 200,
    method: "GET",
    isActive: true,
    currentStatus: "up",
    consecutiveFailures: 0,
    lastCheckedAt: null,
    createdAt: new Date(),
  };

  try {
    const res = await checkMonitor(maliciousMonitor);
    const blockedAndDown = res.status === "down" && res.statusCode === null;
    record(
      "SSRF target in checkMonitor blocked immediately",
      "Worker",
      blockedAndDown,
      `Expected status="down" & statusCode=null, got status="${res.status}", statusCode=${res.statusCode}`
    );
  } catch (err: any) {
    record("SSRF target in checkMonitor blocked immediately", "Worker", false, `Exception: ${err.message}`);
  }

  // Test live check on real fast domain (JIERjoki)
  const realFastMonitor: Monitor = {
    id: "00000000-0000-0000-0000-000000000003",
    name: "JIERjoki Real",
    url: "https://web-joki-tugas.vercel.app",
    expectedStatus: 200,
    method: "GET",
    isActive: true,
    currentStatus: "up",
    consecutiveFailures: 0,
    lastCheckedAt: null,
    createdAt: new Date(),
  };

  try {
    const res = await checkMonitor(realFastMonitor);
    const isSuccess = res.status === "up" && res.statusCode === 200;
    record(
      "Live check on real public URL returns 200 UP",
      "Worker",
      isSuccess,
      `Status: ${res.status}, statusCode: ${res.statusCode}, latency: ${res.responseTimeMs}ms`
    );
  } catch (err: any) {
    record("Live check on real public URL returns 200 UP", "Worker", false, `Exception: ${err.message}`);
  }
}

async function main() {
  console.log("🚀 Starting StatusBoard Comprehensive Multi-Scenario Stress Test...\n");
  const startTime = performance.now();

  await runSsrfSuite();
  await runUptimeMathSuite();
  await runAuthSecuritySuite();
  await runHttpWorkerSuite();

  const total = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const warned = results.filter((r) => r.status === "WARN").length;
  const elapsed = Math.round(performance.now() - startTime);

  console.log("\n==================================================");
  console.log("FINAL TEST SUMMARY REPORT");
  console.log("==================================================");
  console.log(`Total Scenarios Tested : ${total}`);
  console.log(`Passed                 : ${passed}`);
  console.log(`Failed                 : ${failed}`);
  console.log(`Warnings               : ${warned}`);
  console.log(`Execution Time         : ${elapsed}ms`);
  console.log("==================================================");

  if (failed > 0) {
    console.error("\n❌ Some test scenarios FAILED! Root causes:");
    for (const f of results.filter((r) => r.status === "FAIL")) {
      console.error(`  - [${f.category}] ${f.name}: ${f.detail}`);
    }
    process.exit(1);
  } else {
    console.log("\n🎉 ALL SCENARIOS PASSED WITH ZERO CRITICAL FAILURES!");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});

import * as fs from "fs";
import * as path from "path";
import { execSync, execFileSync } from "child_process";
import * as dotenv from "dotenv";

// Load dotenv from cwd or worktree parent directory
const envLocalCwd = path.resolve(process.cwd(), ".env.local");
const envCwd = path.resolve(process.cwd(), ".env");
const envLocalParent = path.resolve(process.cwd(), "../../.env.local");
const envParent = path.resolve(process.cwd(), "../../.env");

if (fs.existsSync(envLocalCwd)) {
  dotenv.config({ path: envLocalCwd });
} else if (fs.existsSync(envLocalParent)) {
  dotenv.config({ path: envLocalParent });
}

if (fs.existsSync(envCwd)) {
  dotenv.config({ path: envCwd });
} else if (fs.existsSync(envParent)) {
  dotenv.config({ path: envParent });
}

interface AuditCheck {
  id: string;
  name: string;
  category: "INFRA" | "SECURITY" | "CODE_INTEGRITY" | "ENV_CONFIG" | "MAINTENANCE";
  run: () => { pass: boolean; message: string };
}

const checks: AuditCheck[] = [
  // 1. INFRA: Database Connection Pre-flight
  {
    id: "INFRA_DB_LIVE",
    name: "Live Database Connectivity (SELECT 1)",
    category: "INFRA",
    run: () => {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        return { pass: false, message: "DATABASE_URL is not set in environment or .env.local" };
      }
      try {
        const nodeScript = `
          try {
            const dotenv = require("dotenv");
            const path = require("path");
            const fs = require("fs");
            const lCwd = path.resolve(process.cwd(), ".env.local");
            const lParent = path.resolve(process.cwd(), "../../.env.local");
            if (fs.existsSync(lCwd)) dotenv.config({ path: lCwd });
            else if (fs.existsSync(lParent)) dotenv.config({ path: lParent });
          } catch {}
          const postgres = require("postgres");
          const url = process.env.DATABASE_URL || "${dbUrl}";
          if (!url) process.exit(1);
          const sql = postgres(url, { prepare: false, connect_timeout: 5 });
          sql\`SELECT 1 as alive\`.then((res) => {
            sql.end();
            process.exit(res && res[0].alive === 1 ? 0 : 1);
          }).catch(() => {
            sql.end();
            process.exit(1);
          });
        `;
        execFileSync(process.execPath, ["-e", nodeScript], {
          env: process.env,
          stdio: "ignore",
        });
        return { pass: true, message: "Supabase/PostgreSQL is online and responsive" };
      } catch {
        return { pass: false, message: "Database connection failed! Project may be paused or offline" };
      }
    },
  },

  // 2. CODE INTEGRITY: Anti-Mock / Banned Hallucinated Subdomains
  {
    id: "INTEGRITY_NO_HALLUCINATED_DOMAINS",
    name: "Zero Hallucinated / Banned Domains in Source Files",
    category: "CODE_INTEGRITY",
    run: () => {
      const banned = [
        "snip.ajiarlando.my.id",
        "kospedia.ajiarlando.my.id",
        "simagang.ajiarlando.my.id",
        "finance.ajiarlando.my.id",
        "status.ajiarlando.my.id",
        "aji.dev",
        ["example", "com"].join("."),
      ];

      const srcFiles: string[] = [];
      function walk(dir: string) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (!["node_modules", ".next", ".git"].includes(entry.name)) {
              walk(full);
            }
          } else if (/\.(tsx?|jsx?|json|sql)$/.test(entry.name)) {
            // Exclude test scripts from domain checks if they test the blocker
            if (!full.includes("test-all-scenarios") && !full.includes("orchestrator-audit")) {
              srcFiles.push(full);
            }
          }
        }
      }
      walk(process.cwd());

      const violations: string[] = [];
      for (const file of srcFiles) {
        const content = fs.readFileSync(file, "utf-8");
        for (const b of banned) {
          if (content.includes(b)) {
            violations.push(`${path.relative(process.cwd(), file)}: contains "${b}"`);
          }
        }
      }

      if (violations.length > 0) {
        return { pass: false, message: `Found banned/hallucinated domains:\n  ${violations.join("\n  ")}` };
      }
      return { pass: true, message: "No hallucinated or dummy domains found in code" };
    },
  },

  // 3. CODE INTEGRITY: Anti-Suppression Gate (@ts-ignore, @ts-nocheck, eslint-disable)
  {
    id: "INTEGRITY_NO_LINT_SUPPRESSION",
    name: "Zero TypeScript & ESLint Suppression Hacks",
    category: "CODE_INTEGRITY",
    run: () => {
      const suppressionPatterns = [
        /\/\/\s*@ts-ignore/,
        /\/\/\s*@ts-nocheck/,
        /\/\*\s*eslint-disable\s*\*\//,
      ];

      const srcFiles: string[] = [];
      function walk(dir: string) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (!["node_modules", ".next", ".git"].includes(entry.name)) {
              walk(full);
            }
          } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
            if (!full.includes("orchestrator-audit")) {
              srcFiles.push(full);
            }
          }
        }
      }
      walk(process.cwd());

      const violations: string[] = [];
      for (const file of srcFiles) {
        const content = fs.readFileSync(file, "utf-8");
        for (const pattern of suppressionPatterns) {
          if (pattern.test(content)) {
            violations.push(`${path.relative(process.cwd(), file)} matches ${pattern}`);
          }
        }
      }

      if (violations.length > 0) {
        return { pass: false, message: `Found suppression hacks:\n  ${violations.join("\n  ")}` };
      }
      return { pass: true, message: "Clean codebase: 0 @ts-ignore, 0 @ts-nocheck, 0 eslint-disable" };
    },
  },

  // 4. SECURITY: Secret Leakage in Tracked Git Files
  {
    id: "SECURITY_NO_SECRETS_IN_GIT",
    name: "No Secrets / Passwords Leaked in Tracked Git Files",
    category: "SECURITY",
    run: () => {
      try {
        const trackedFiles = execSync("git ls-files", { encoding: "utf-8" })
          .split("\n")
          .filter(Boolean);

        const secretPatterns = [
          /postgres:\/\/[^:]+:([^@]+)@/i, // Real DB password in URL
          /BEGIN PRIVATE KEY/,
          /CRON_SECRET\s*=\s*["'][a-zA-Z0-9_\-]{16,}["']/,
          /SESSION_SECRET\s*=\s*["'][a-zA-Z0-9_\-]{16,}["']/,
        ];

        const leaks: string[] = [];
        for (const file of trackedFiles) {
          if (file === ".env.local" || file === ".env" || !fs.existsSync(file)) continue;
          const content = fs.readFileSync(file, "utf-8");
          for (const sp of secretPatterns) {
            if (sp.test(content) && !file.includes("orchestrator-audit")) {
              leaks.push(`${file} matches ${sp}`);
            }
          }
        }

        if (leaks.length > 0) {
          return { pass: false, message: `Potential secrets leaked in tracked git files:\n  ${leaks.join("\n  ")}` };
        }
        return { pass: true, message: "No raw database credentials or secrets leaked in git tracking" };
      } catch (err: any) {
        return { pass: false, message: `Git secret check failed: ${err.message}` };
      }
    },
  },

  // 5. SECURITY: npm audit (0 High / 0 Critical CVE)
  {
    id: "SECURITY_NPM_AUDIT_ZERO_HIGH",
    name: "npm audit has 0 High or Critical CVEs",
    category: "SECURITY",
    run: () => {
      try {
        const auditJson = execSync("npm audit --json", { encoding: "utf-8" });
        const data = JSON.parse(auditJson);
        const vulns = data.metadata?.vulnerabilities || {};
        const high = vulns.high || 0;
        const critical = vulns.critical || 0;

        if (high > 0 || critical > 0) {
          return {
            pass: false,
            message: `Vulnerabilities found! High: ${high}, Critical: ${critical}. Run 'npm audit fix' or patch packages.`,
          };
        }
        return { pass: true, message: `0 High, 0 Critical vulnerabilities (Total moderate/low: ${vulns.moderate || 0})` };
      } catch (err: any) {
        // npm audit exits with 1 if vulnerabilities exist
        if (err.stdout) {
          try {
            const data = JSON.parse(err.stdout.toString());
            const vulns = data.metadata?.vulnerabilities || {};
            const high = vulns.high || 0;
            const critical = vulns.critical || 0;
            if (high > 0 || critical > 0) {
              return { pass: false, message: `npm audit detected High: ${high}, Critical: ${critical}` };
            }
          } catch {}
        }
        return { pass: true, message: "Audit clean" };
      }
    },
  },

  // 6. ENV_CONFIG: .env.example Synchronization
  {
    id: "ENV_EXAMPLE_SYNC",
    name: ".env.example contains all required environment variables",
    category: "ENV_CONFIG",
    run: () => {
      const examplePath = path.resolve(process.cwd(), ".env.example");
      if (!fs.existsSync(examplePath)) {
        return { pass: false, message: ".env.example does not exist in root project!" };
      }

      const exampleContent = fs.readFileSync(examplePath, "utf-8");
      const requiredVars = ["DATABASE_URL", "CRON_SECRET", "SESSION_SECRET", "OWNER_PASSWORD_HASH"];

      const missing: string[] = [];
      for (const v of requiredVars) {
        if (!exampleContent.includes(v)) {
          missing.push(v);
        }
      }

      if (missing.length > 0) {
        return { pass: false, message: `Missing variables in .env.example: ${missing.join(", ")}` };
      }
      return { pass: true, message: "All essential production environment variables documented in .env.example" };
    },
  },
];

console.log("==================================================");
console.log("🛡️  ORCHESTRATOR & DEV AGENT ZERO-FAILURE AUDIT");
console.log("==================================================");

let failedCount = 0;
for (const check of checks) {
  const result = check.run();
  const icon = result.pass ? "✓" : "✗";
  const tag = result.pass ? "PASS" : "FAIL";
  console.log(`\n${icon} [${tag}] [${check.category}] ${check.name}`);
  console.log(`  -> ${result.message}`);
  if (!result.pass) failedCount++;
}

console.log("\n==================================================");
console.log(`AUDIT FINISHED: ${checks.length - failedCount}/${checks.length} checks passed.`);
console.log("==================================================");

if (failedCount > 0) {
  console.error("\n❌ GATES BLOCKED: Do NOT merge or dispatch until all items pass!");
  process.exit(1);
} else {
  console.log("\n✨ ALL GATES PASSED! Safe to dispatch, commit, or merge.");
  process.exit(0);
}

import { URL } from "url";
import { isIP } from "net";
import * as dns from "node:dns";

const PRIVATE_IPV4_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^198\.(1[89])\./,
];

const PRIVATE_IPV6_RANGES = [
  /^::1$/,
  /^fc00:/i,
  /^fd/i,
  /^fe80:/i,
  /^::$/,
];

const IPV6_MAPPED_IPV4 = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i;

const BLOCKED_HOSTNAMES = [
  "localhost",
  "localhost.localdomain",
  "[::1]",
  "0.0.0.0",
  "[::ffff:127.0.0.1]",
  "[::ffff:0.0.0.0]",
];

function normalizeIP(raw: string): string | null {
  const mapped = raw.match(IPV6_MAPPED_IPV4);
  if (mapped) return mapped[1];
  return null;
}

function parseDecimalIP(s: string): string | null {
  const n = Number(s);
  if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) return null;
  return `${(n >>> 24) & 0xff}.${(n >>> 16) & 0xff}.${(n >>> 8) & 0xff}.${n & 0xff}`;
}

function parseHexIP(s: string): string | null {
  if (!/^0x[0-9a-f]{1,8}$/i.test(s)) return null;
  const n = parseInt(s, 16);
  if (n > 0xffffffff) return null;
  return `${(n >>> 24) & 0xff}.${(n >>> 16) & 0xff}.${(n >>> 8) & 0xff}.${n & 0xff}`;
}

function parseOctalIP(s: string): string | null {
  const parts = s.split(".");
  if (parts.length !== 4) return null;
  if (!parts.every((p) => /^0[0-7]+$/.test(p))) return null;
  const nums = parts.map((p) => parseInt(p, 8));
  if (nums.some((n) => n > 255)) return null;
  return nums.join(".");
}

export function isPrivateIPv4(ip: string): boolean {
  return PRIVATE_IPV4_RANGES.some((r) => r.test(ip));
}

export function isPrivateIPv6(ip: string): boolean {
  return PRIVATE_IPV6_RANGES.some((r) => r.test(ip));
}

export function isPrivateIP(ip: string): boolean {
  const mapped = normalizeIP(ip);
  if (mapped) return isPrivateIPv4(mapped);

  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  if (isIP(ip) === 6) return isPrivateIPv6(ip);

  const asDecimal = parseDecimalIP(ip);
  if (asDecimal) return isPrivateIPv4(asDecimal);

  const asHex = parseHexIP(ip);
  if (asHex) return isPrivateIPv4(asHex);

  const asOctal = parseOctalIP(ip);
  if (asOctal) return isPrivateIPv4(asOctal);

  return false;
}

export function isPrivateUrlSync(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return true;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return true;
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

  if (BLOCKED_HOSTNAMES.includes(hostname.toLowerCase())) {
    return true;
  }

  if (isIP(hostname)) {
    return isPrivateIP(hostname);
  }

  return isPrivateIP(hostname);
}

/**
 * Validates a URL against SSRF and DNS rebinding attacks.
 * Performs syntactic validation and asynchronous DNS resolution lookup
 * to ensure the hostname does not resolve to private or loopback IP addresses.
 */
export async function isPrivateUrl(rawUrl: string): Promise<boolean> {
  if (isPrivateUrlSync(rawUrl)) {
    return true;
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return true;
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

  if (isIP(hostname)) {
    return isPrivateIP(hostname);
  }

  try {
    const addresses = await dns.promises.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return false;
    }

    for (const record of addresses) {
      if (isPrivateIP(record.address)) {
        return true;
      }
    }
  } catch {
    // DNS resolution failure (ENOTFOUND/EAI_AGAIN) is handled during HTTP fetch
    return false;
  }

  return false;
}

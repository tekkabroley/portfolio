const COOKIE_NAME = "family_auth";
const MAX_AGE_SECONDS = 2592000; // 30 days

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function parseCookies(request) {
  const cookieString = request.headers.get("Cookie") || "";
  const cookies = {};
  for (const part of cookieString.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name) cookies[name] = value;
  }
  return cookies;
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(env) {
  if (!env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is not set");
  }

  const payloadObject = {
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
    nonce: crypto.randomUUID(),
  };
  const payload = bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify(payloadObject)),
  );
  const key = await importHmacKey(env.SESSION_SECRET);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );

  return `${payload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export function sessionCookieHeader(token) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}`;
}

export async function verifySession(request, env) {
  if (!env.SESSION_SECRET) {
    return { ok: false, reason: "config" };
  }

  const token = parseCookies(request)[COOKIE_NAME];
  if (!token) {
    return { ok: false, reason: "missing" };
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return { ok: false, reason: "malformed" };
  }

  try {
    const key = await importHmacKey(env.SESSION_SECRET);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signature),
      new TextEncoder().encode(payload),
    );
    if (!valid) {
      return { ok: false, reason: "signature" };
    }

    const claims = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payload)),
    );
    if (
      typeof claims.exp !== "number" ||
      claims.exp < Math.floor(Date.now() / 1000)
    ) {
      return { ok: false, reason: "expired" };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

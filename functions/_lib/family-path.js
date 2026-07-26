const SAFE_FAMILY_PATH = /^family\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/;

/**
 * Normalize and validate a private family S3 object key.
 * Returns the normalized key, or null if invalid.
 */
export function normalizeFamilyImagePath(raw) {
  if (typeof raw !== "string" || raw.length === 0) {
    return null;
  }

  let path;
  try {
    path = decodeURIComponent(raw.trim());
  } catch {
    return null;
  }

  if (
    path.includes("\0") ||
    path.includes("\\") ||
    path.includes("://") ||
    path.startsWith("/") ||
    path.includes("..")
  ) {
    return null;
  }

  path = path.replace(/\/+/g, "/");

  if (!SAFE_FAMILY_PATH.test(path)) {
    return null;
  }

  return path;
}

export function isAllowlistedFamilyPath(path, allowlist) {
  return Array.isArray(allowlist) && allowlist.includes(path);
}

#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GALLERY_DIR = path.join(ROOT, "src/content/gallery");
const CONFIG_DIR = path.join(ROOT, "src/config");
const REGISTERED_PATH = path.join(
  ROOT,
  "src/lib/registered-collections.json",
);

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const data = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    data[key] = line.slice(colonIdx + 1).trim();
  }
  return data;
}

const registered = JSON.parse(fs.readFileSync(REGISTERED_PATH, "utf8"));
const errors = [];

const galleryBySlug = new Map();

for (const file of fs.readdirSync(GALLERY_DIR).filter((f) => f.endsWith(".md"))) {
  const slug = path.basename(file, ".md");
  const frontmatter = parseFrontmatter(
    fs.readFileSync(path.join(GALLERY_DIR, file), "utf8"),
  );
  galleryBySlug.set(slug.toLowerCase(), {
    file,
    collection: frontmatter.collection,
  });
}

for (const [slug, title] of Object.entries(registered)) {
  const configPath = path.join(CONFIG_DIR, `${slug}.json`);
  if (!fs.existsSync(configPath)) {
    errors.push(`Registered collection "${slug}" is missing ${path.relative(ROOT, configPath)}`);
    continue;
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (!Array.isArray(config.slots)) {
    errors.push(`${path.relative(ROOT, configPath)} is missing a "slots" array`);
    continue;
  }

  const slottedSlugs = new Set();

  for (const slot of config.slots) {
    if (!slot.imageSlug) {
      errors.push(`${slug}: slot "${slot.id}" is missing imageSlug`);
      continue;
    }

    const key = String(slot.imageSlug).toLowerCase();
    slottedSlugs.add(key);
    const entry = galleryBySlug.get(key);

    if (!entry) {
      errors.push(
        `${slug}: config slot "${slot.id}" references missing gallery entry "${slot.imageSlug}"`,
      );
      continue;
    }

    if (
      !entry.collection ||
      entry.collection.toLowerCase() !== String(title).toLowerCase()
    ) {
      errors.push(
        `${slug}: gallery entry "${slot.imageSlug}" has collection "${entry.collection ?? "(none)"}" but config expects "${title}"`,
      );
    }
  }

  for (const [imageSlug, entry] of galleryBySlug) {
    if (
      entry.collection &&
      entry.collection.toLowerCase() === String(title).toLowerCase() &&
      !slottedSlugs.has(imageSlug)
    ) {
      errors.push(
        `${slug}: gallery entry "${entry.file}" is tagged "${title}" but is not present in ${slug}.json`,
      );
    }
  }
}

for (const [imageSlug, entry] of galleryBySlug) {
  if (!entry.collection) {
    errors.push(`gallery entry "${entry.file}" is missing a collection field`);
    continue;
  }

  const isRegistered = Object.values(registered).some(
    (title) => String(title).toLowerCase() === entry.collection.toLowerCase(),
  );
  if (!isRegistered) {
    errors.push(
      `gallery entry "${entry.file}" uses unregistered collection "${entry.collection}"`,
    );
  }
}

if (errors.length > 0) {
  console.error("Gallery config validation failed:\n");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Gallery config validation passed.");

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
    const rawValue = line.slice(colonIdx + 1).trim();
    if (/^-?\d+$/.test(rawValue)) {
      data[key] = Number(rawValue);
    } else if (/^-?\d+\.\d+$/.test(rawValue)) {
      data[key] = Number(rawValue);
    } else {
      data[key] = rawValue;
    }
  }

  return data;
}

function collectionToConfigFilename(collection) {
  return `${collection.toLowerCase()}.json`;
}

function nextSlotId(slots) {
  const numbers = slots.map((slot) => {
    const match = slot.id?.match(/^slot-(\d+)$/);
    return match ? Number(match[1]) : 0;
  });

  return `slot-${Math.max(0, ...numbers) + 1}`;
}

function createSlot(id, width, height, imageSlug) {
  const isPortrait = height > width;

  if (isPortrait) {
    return {
      id,
      targetRatio: width / height,
      width: 1200,
      height: 1800,
      layout: "grid",
      gridClass: "row-span-3",
      aspectClass: "aspect-[2/3]",
      imageSlug,
    };
  }

  return {
    id,
    targetRatio: width / height,
    width: 1800,
    height: 1200,
    layout: "grid",
    gridClass: "row-span-2",
    aspectClass: "aspect-[3/2]",
    imageSlug,
  };
}

function loadOrCreateConfig(configPath) {
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (!Array.isArray(config.slots)) {
      throw new Error(`${configPath} is missing a "slots" array.`);
    }
    return config;
  }

  return { slots: [] };
}

function writeConfig(configPath, config) {
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

const registered = JSON.parse(fs.readFileSync(REGISTERED_PATH, "utf8"));
const registeredSlugs = new Set(Object.keys(registered));
const registeredTitles = new Map(
  Object.entries(registered).map(([slug, title]) => [
    String(title).toLowerCase(),
    slug,
  ]),
);

const mdFiles = fs
  .readdirSync(GALLERY_DIR)
  .filter((file) => file.endsWith(".md"))
  .sort();

let createdConfigs = 0;
let addedSlots = 0;
let skipped = 0;

for (const file of mdFiles) {
  const filePath = path.join(GALLERY_DIR, file);
  const content = fs.readFileSync(filePath, "utf8");
  const frontmatter = parseFrontmatter(content);
  const collection = frontmatter.collection;

  if (!collection || typeof collection !== "string") {
    console.warn(`Skipping ${file}: no collection value found.`);
    skipped++;
    continue;
  }

  const slug = registeredTitles.get(collection.toLowerCase());
  if (!slug || !registeredSlugs.has(slug)) {
    console.warn(
      `Skipping ${file}: collection "${collection}" is not registered in src/lib/registered-collections.json.`,
    );
    skipped++;
    continue;
  }

  const configFilename = collectionToConfigFilename(slug);
  const configPath = path.join(CONFIG_DIR, configFilename);
  const configExisted = fs.existsSync(configPath);
  const config = loadOrCreateConfig(configPath);

  if (!configExisted) {
    createdConfigs++;
    console.log(`Created ${path.relative(ROOT, configPath)}`);
  }

  const imageSlug = path.basename(file, ".md");
  const alreadyPresent = config.slots.some(
    (slot) => slot.imageSlug?.toLowerCase() === imageSlug.toLowerCase(),
  );

  if (alreadyPresent) {
    skipped++;
    continue;
  }

  const width = typeof frontmatter.width === "number" ? frontmatter.width : 1800;
  const height =
    typeof frontmatter.height === "number" ? frontmatter.height : 1200;
  const slot = createSlot(nextSlotId(config.slots), width, height, imageSlug);

  config.slots.push(slot);
  writeConfig(configPath, config);
  addedSlots++;
  console.log(`Added ${imageSlug} to ${configFilename}`);
}

console.log(
  `\nDone. Created ${createdConfigs} config file(s), added ${addedSlots} slot(s), skipped ${skipped}.`,
);

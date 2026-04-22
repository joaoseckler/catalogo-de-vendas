import fs from "node:fs/promises";
import { parse } from "csv-parse/sync";
import minimist from "minimist";
import fetch from "node-fetch";
import { type Row, RowSchema } from "../src/data";
import { downloadImage } from "./image";

const CONFIG_PATH = "sites.json";
let VERBOSE = false;

function log(...args: any[]) {
  if (VERBOSE) {
    console.log(...args);
  }
}

function sheetUrlToDownload(url: string) {
  const match = url.match(
    /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)\/edit\?gid=(\d+)/,
  );
  if (!match) {
    throw new Error(`Invalid Google Sheets URL: ${url}`);
  }
  const [_, sheetId, gid] = match;
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

async function fetchSiteData(site: string, url: string) {
  const downloadUrl = sheetUrlToDownload(url);
  const res = await fetch(downloadUrl);
  const text = await res.text();

  const columnMap = {
    id: "id",
    ordem: "order",
    título: "title",
    descrição: "description",
    localização: "location",
    valor: "value",
    "por unidade?": "perUnit",
    medidas: "measurements",
    "links para imagens": "imageLinks",
    status: "status",
  };

  let data: Row[] = parse(text, {
    columns(header) {
      return header.map((h) => columnMap[h as keyof typeof columnMap] || null);
    },
    skip_empty_lines: true,
    trim: true,
  });

  // Skip second line, with column descriptions
  data = data.slice(1);
  data = data.filter((row) => row.id && row.title);
  data = data.map((row, i) => {
    log(`Validating row ${i + 1}/${data.length}...`);
    const result = RowSchema.safeParse(row);

    if (!result.success) {
      console.error(`Invalid row ${i}:`);
      console.error(JSON.stringify(result.error, null, 2));
      process.exit(1);
    }

    return result.data;
  });

  for (const row of data) {
    log(`Processing images for row ${row.id + 1}/${data.length}...`);
    const paths: string[] = [];
    for (const link of row.imageLinks) {
      if (typeof link !== "string" || !link.startsWith("http")) {
        console.error(`Invalid image link in row ${row.id}: ${link}`);
        process.exit(1);
      }
      const path = await downloadImage(link, site, "images");
      if (!path) {
        console.error(
          `Failed to download image from link in row ${row.id}: ${link}`,
        );
        process.exit(1);
      }
      paths.push(path);
    }

    row.imageLinks = paths;
  }

  await fs.writeFile(`src/data/${site}.json`, JSON.stringify(data, null, 2));
}

async function fetchSitesData() {
  log("Fetching sites data...");
  const res = await fetch(
    sheetUrlToDownload(process.env.SITES_CONFIG_URL || ""),
  );
  const text = await res.text();

  const data = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  await fs.writeFile(CONFIG_PATH, JSON.stringify(data, null, 2));
}

async function readConfig() {
  const raw = await fs.readFile(CONFIG_PATH, "utf-8");
  const data = JSON.parse(raw);

  for (const { favicon, name, og } of data) {
    if (favicon) {
      const path = await downloadImage(favicon, name, "favicons");
      if (!path) {
        console.error(`Failed to download favicon from link: ${favicon}`);
        process.exit(1);
      }
    }

    if (og) {
      const path = await downloadImage(og, name, "og");
      if (!path) {
        console.error(`Failed to download og iamge from link: ${og}`);
        process.exit(1);
      }
    }
  }

  return data;
}

async function readAndFetchAll() {
  const options = minimist(process.argv.slice(2), {
    alias: { v: "verbose", h: "help", s: "site" },
    boolean: ["verbose", "help"],
    string: ["site"],
  });

  VERBOSE = (options.verbose || false) as boolean;
  const help: boolean = options.help || false;

  if (help) {
    console.log("Usage: bun scripts/fetch-data.ts [options]");
    console.log("Options:");
    console.log("  -v, --verbose   Enable verbose logging");
    console.log("  -h, --help      Show this help message");
    console.log("  -s, --site      Select site by name");
    return;
  }

  try {
    await fetchSitesData();
  } catch {
    try {
      await fs.access(CONFIG_PATH);
    } catch {
      console.error(
        "Failed to fetch config and no local config found. Please check your internet connection and try again.",
      );
      return;
    }
  }

  const config = await readConfig();
  for (const { name, url } of config) {
    log("------");
    if (options.site && options.site !== name) {
      log(`Skipping ${name} (not selected)`);
      continue;
    }
    log(`Fetching data for ${name}...\n`);
    try {
      await fetchSiteData(name, url);
    } catch (error) {
      console.error(`Failed to fetch data for ${name}:`, error);
    }
  }
}

await readAndFetchAll();

import fs from "node:fs/promises";
import path from "node:path";
import ejs from "ejs";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import strip from "strip-markdown";
import { unified } from "unified";

async function getSite() {
  let site = process.env.SITE;

  if (!site) {
    const files = await fs.readdir("src/data");
    const otherFile = files.find((file) => file !== "sheet.json");
    if (!otherFile) {
      console.error(
        "No site specified and no other data file found in src/data/. Please set the SITE environment variable or add a data file.",
      );
      process.exit(1);
    } else {
      site = otherFile.replace(".json", "");
    }
  }

  return site;
}

async function getSiteData(site: string) {
  const sitesData = await fs
    .readFile("sites.json", "utf-8")
    .then((data) => JSON.parse(data))
    .catch((err) => {
      console.error("Error reading sites.json:", err);
      process.exit(1);
    });

  const siteData = sitesData.filter(
    (s: { name: string }) => s.name === site,
  )[0];
  if (!siteData) {
    console.error(
      `Site "${site}" not found in sites.json. Please check the SITE environment variable or update sites.json.`,
    );
    process.exit(1);
  }

  return siteData;
}

async function createSiteConfig(
  site: string,
  siteData: Record<string, string>,
) {
  const src = `src/data/${site}.json`;
  const dest = `src/data/sheet.json`;

  await fs.copyFile(src, dest);
  await fs.writeFile("src/data/site.json", JSON.stringify(siteData, null, 2));
}

async function markdownToPlainText(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(strip)
    .use(remarkStringify)
    .process(markdown);
  return result.toString().trim();
}

async function createIndex(siteData: Record<string, string>) {
  // Write index.html from template
  const template = await fs.readFile("index.template.html", "utf-8");
  const description = await markdownToPlainText(siteData.description);
  const html = ejs.render(template, { ...siteData, description });

  await fs.writeFile("index.html", html);
}

type FileAndMtime = {
  file: string;
  mtime: number;
};

async function getLatestFileInDirectory(
  directory: string,
): Promise<string | null> {
  const files = await fs.readdir(directory);
  return (
    await Promise.all(
      files.map(async (file) => ({
        file,
        mtime: (await fs.stat(directory)).mtime.getTime(),
      })),
    )
  ).sort((a: FileAndMtime, b: FileAndMtime) => b.mtime - a.mtime)[0]?.file;
}

async function copyImages(site: string) {
  const siteDirectory = path.join("images", site);

  let exists = true;
  try {
    await fs.stat(siteDirectory);
  } catch {
    exists = false;
  }

  if (!exists) {
    console.warn(
      `No images folder found for site "${site}" in images. Skipping image copy.`,
    );
    return;
  }

  await fs.mkdir("public/images", { recursive: true });

  const dest = `public/images/`;

  await fs.rm(dest, { recursive: true });
  await fs.mkdir(dest, { recursive: true });

  const images = await fs.readdir(`${siteDirectory}/images`);
  for (const image of images) {
    await fs.copyFile(
      `${siteDirectory}/images/${image}`,
      path.join(dest, image),
    );
  }

  for (const [key, target] of [
    ["favicon", "favicon.webp"],
    ["og", "og-image.webp"],
    ["logo", "logo.webp"],
  ]) {
    const file = await getLatestFileInDirectory(path.join(siteDirectory, key));

    if (!file) {
      console.warn(
        `No ${key} found for site "${site}" in images. Skipping copy.`,
      );
      return;
    }

    await fs.copyFile(path.join(siteDirectory, key, file), `public/${target}`);
  }
}

async function main() {
  const site = await getSite();
  const siteData = await getSiteData(site);
  await createSiteConfig(site, siteData);
  await createIndex(siteData);
  await copyImages(site);
}

await main();

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import fetch from "node-fetch";

const PUBLIC_DIR = "public/images";

function linkToSrc(link: string) {
  const url = new URL(link);
  const regex = /(?:[\w-]{25,})/;
  const match = url.pathname.match(regex);
  const id = match ? match[0] : null;

  if (!id) {
    throw new Error(`Invalid link: ${link}`);
  }
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withBackoff<T>(
  fn: () => Promise<T>,
  {
    retries = 5,
    baseDelay = 500, // ms
    maxDelay = 10000, // cap
  } = {},
) {
  let attempt = 0;

  while (attempt < 15) {
    try {
      return await fn();
    } catch (err) {
      attempt++;

      const retryAfter = err?.response?.headers?.get?.("retry-after");
      if (retryAfter) {
        const time = Number(retryAfter) * 1000;
        console.warn(`Retry after received from google: ${time}ms`);
        await sleep(time);
      }

      const status = err?.response?.status || err?.status;

      // retry only for rate limit / transient errors
      const retryable =
        status === 429 || (status >= 500 && status < 600) || !status; // network errors

      if (!retryable || attempt > retries) {
        throw err;
      }

      // exponential backoff with jitter
      const exp = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);
      const jitter = Math.random() * 0.3 * exp; // 0–30% jitter
      const delay = exp + jitter;

      console.warn(`Retry ${attempt} in ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }
}

async function _downloadImage(link: string) {
  const url = linkToSrc(link);
  if (!url) return null;

  // deterministic filename (avoids duplicates)
  const basename = crypto.createHash("sha1").update(url).digest("hex");
  const basepath = path.join(PUBLIC_DIR, basename);

  // avoid re-downloading
  for await (const match of fs.glob(`${basepath}.*`)) {
    return `/${path.relative("public", match)}`;
  }

  console.log(`    -- Downloading image from ${url}`);
  const res = await fetch(url);

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.response = res;
    throw err;
  }

  const contentType = res.headers.get("content-type") || "";
  const ext = contentType.includes("png")
    ? ".png"
    : contentType.includes("jpeg")
      ? ".jpg"
      : contentType.includes("webp")
        ? ".webp"
        : "";

  const filename = basename + ext;
  const filepath = path.join(PUBLIC_DIR, filename);
  const buffer = Buffer.from(await res.arrayBuffer());

  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  await fs.writeFile(filepath, buffer);

  return `/images/${filename}`;
}

export async function downloadImage(link: string) {
  return withBackoff(() => _downloadImage(link));
}

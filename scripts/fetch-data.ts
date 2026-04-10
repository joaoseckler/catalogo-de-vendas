import fs from "node:fs/promises";
import { parse } from "csv-parse/sync";
import fetch from "node-fetch";
import { type Row, RowSchema } from "../src/data";
import { downloadImage } from "./image";

const URL =
  "https://docs.google.com/spreadsheets/d/1KlhZKs9yn8-7zKpO4o3I_o5eUH0FF9BlBIln7dLKdaA/export?format=csv&gid=0";

const res = await fetch(URL);
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

data = data.filter((row) => row.id && row.title);
data = data.map((row, i) => {
  console.log(`Validating row ${i + 1}/${data.length}...`);
  const result = RowSchema.safeParse(row);

  if (!result.success) {
    console.error(`Invalid row ${i}:`);
    console.error(JSON.stringify(result.error, null, 2));
    process.exit(1);
  }

  return result.data;
});

for (const row of data) {
  console.log(`Processing images for row ${row.id + 1}/${data.length}...`);
  const paths: string[] = [];
  for (const link of row.imageLinks) {
    if (typeof link !== "string" || !link.startsWith("http")) {
      console.error(`Invalid image link in row ${row.id}: ${link}`);
      process.exit(1);
    }
    const path = await downloadImage(link);
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

await fs.writeFile("src/data/sheet.json", JSON.stringify(data, null, 2));

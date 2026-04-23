import { z } from "zod";

function toNumber(value: string): number | null {
  const n = Number(
    value
      .replace(/^R\$\s*/, "")
      .replace(/\./g, "")
      .replace(/,/g, "."),
  );
  return n;
}

function toBoolean(value: string): boolean {
  return value.toLowerCase() === "true";
}

function splitImageLinks(value: string): string[] {
  return value
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const RowSchema = z.object({
  id: z.coerce.number().nonnegative(),
  title: z.string().min(1),
  description: z.string().nullable(),
  location: z.string().nullable(),
  value: z.preprocess(toNumber, z.coerce.number().nonnegative()),
  perUnit: z.preprocess(toBoolean, z.coerce.boolean()),
  measurements: z.string().nullable(),
  imageLinks: z.preprocess(
    splitImageLinks,
    z.array(z.coerce.string()).default([]),
  ),
  status: z.string().nullable(),
});

export const ConfigSchema = z.object({
  url: z.string(),
  name: z.string(),
  domain: z.string(),
  basePath: z.string(),
  deployPath: z.string(),
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  primaryColor: z.string(),
  favicon: z.string(),
  logo: z.string(),
  og: z.string(),
  extraCss: z.string(),
  showReserved: z.preprocess(toBoolean, z.coerce.boolean()),
  showSold: z.preprocess(toBoolean, z.coerce.boolean()),
});

export type Row = z.infer<typeof RowSchema>;
export type Config = z.infer<typeof ConfigSchema>;

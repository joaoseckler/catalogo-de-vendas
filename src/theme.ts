import { generateColors } from "@mantine/colors-generator";
import { createTheme } from "@mantine/core";
import site from "./data/site.json";

let customColor: ReturnType<typeof generateColors> | undefined;
const primaryColor = site.primaryColor || "indigo";

if (site.primaryColor.match(/^#/)) {
  customColor = generateColors(site.primaryColor);
}

export const theme = createTheme({
  fontFamily: "'IBM Plex Sans', sans-serif",
  primaryColor: customColor ? "custom" : primaryColor,
  ...(customColor ? { colors: { custom: customColor } } : {}),
});

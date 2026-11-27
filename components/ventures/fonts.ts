import { Archivo, DM_Serif_Display, Grandstander } from "next/font/google";

/**
 * Brand fonts for the venture wordmarks drawn inside the cubes. Self-hosted by
 * next/font at build time; the canvas draws with the generated family names.
 */
const grandstander = Grandstander({ weight: "800", subsets: ["latin"], display: "block" });
const dmSerif = DM_Serif_Display({ weight: "400", subsets: ["latin"], display: "block" });
const archivo = Archivo({ weight: "600", subsets: ["latin"], display: "block" });

export const brandFonts = {
  /** IP Animations wordmark */
  grandstander: grandstander.style.fontFamily,
  /** IP Studios "IP" */
  dmSerif: dmSerif.style.fontFamily,
  /** IP Studios "STUDIOS" */
  archivo: archivo.style.fontFamily,
};

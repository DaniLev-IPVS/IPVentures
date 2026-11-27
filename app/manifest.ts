import type { MetadataRoute } from "next";

/** Web app manifest: name, colours and the logo icons for home screens. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IP Ventures",
    short_name: "IP Ventures",
    description: "Building the IPs of the future.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

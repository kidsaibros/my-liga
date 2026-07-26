import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MY LIGA",
    short_name: "MY LIGA",
    description: "Havaskor futbol va mini-futbol musobaqalarini boshqarish platformasi",
    start_url: "/",
    display: "standalone",
    background_color: "#1E2425",
    theme_color: "#0E9F6E",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

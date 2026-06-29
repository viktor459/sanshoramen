import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://sanshoramen.se", lastModified: new Date(), priority: 1 },
    { url: "https://sanshoramen.se/pop-ups", lastModified: new Date(), priority: 0.9 },
    { url: "https://sanshoramen.se/blogg", lastModified: new Date(), priority: 0.7 },
  ];
}

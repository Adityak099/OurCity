export default function manifest() {
  return {
    name: "OurCity",
    short_name: "OurCity",
    description:
      "Report city waste issues and track collection progress with OurCity.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7faf7",
    theme_color: "#176b45",
    icons: [
      {
        src: "/pwa-icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

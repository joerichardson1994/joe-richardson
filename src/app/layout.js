import "../styles/globals.css";
import { createClient } from "@/lib/prismicio";
import { PrismicText } from "@prismicio/react";
import SiteChrome from "@/components/SiteChrome";
import IconSprite from "@/components/IconSprite";
import PageTransition from "@/components/PageTransition";

export async function generateMetadata() {
  const client = createClient();
  const settings = await client.getSingle("settings").catch(() => null);

  return {
    title: settings?.data?.site_title || "Portfolio",
    description: settings?.data?.default_meta_description || "",
    icons: settings?.data?.favicon?.url
      ? [{ url: settings.data.favicon.url }]
      : undefined,
  };
}

export default async function RootLayout({ children }) {
  const client = createClient();
  const [navigation, settings] = await Promise.all([
    client.getSingle("navigation").catch(() => null),
    client.getSingle("settings").catch(() => null),
  ]);

  return (
    <html lang="en">
      <body>
        <IconSprite />
        <div className="main_screen">
          <div className="main_wrapper" id="main-wrapper">
            <div className="loader">
              <div className="loader-progress" id="loader-progress" />
            </div>

            <SiteChrome navigation={navigation} settings={settings} />

            <div className="main_content" id="nomad-wrapper">
              <PageTransition>{children}</PageTransition>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

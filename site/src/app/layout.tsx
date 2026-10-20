import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import { SmoothScroll } from "@/features/scroll/SmoothScroll";
import { Cursor } from "@/features/cursor/Cursor";
import { Nav } from "@/components/layout/Nav";
import { TimelineHud } from "@/components/layout/TimelineHud";

// Archivo with its width axis: the display type stretches from condensed to expanded.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

const SITE = "https://kaiohomem.github.io";
const description =
  "Kaio Felipe — dev, motion e CGI. Estudante de Ciências da Computação no IFSC. Sites, ferramentas e vídeos com planos 3D renderizados no Blender.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Kaio Felipe — Dev, Motion & CGI",
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    title: "Kaio Felipe — Dev, Motion & CGI",
    description,
    locale: "pt_BR",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: "Kaio Felipe — Dev, Motion & CGI", description, images: ["/og-image.png"] },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

// GitHub Pages cannot send headers, so the policy rides in a meta tag. Next's static
// export inlines small bootstrap scripts, hence 'unsafe-inline' for scripts.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://api.emailjs.com",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${jetbrains.variable}`}>
      <head>
        {/* Dev mode needs eval for React's debugging tools, so the policy is production-only. */}
        {process.env.NODE_ENV === "production" && <meta httpEquiv="Content-Security-Policy" content={CSP} />}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body>
        <LangProvider>
          <SmoothScroll />
          <Nav />
          {children}
          <TimelineHud />
          <Cursor />
          <div aria-hidden className="grain" />
        </LangProvider>
      </body>
    </html>
  );
}

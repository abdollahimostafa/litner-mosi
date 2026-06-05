// lib/fonts.ts
import localFont from "next/font/local";

export const iransansx = localFont({
  src: "../public/IRANSansXV.woff2",   // ← can be string when there's only one source
  variable: "--font-iransans",
  display: "swap",
  // weight & style are optional / ignored for pure variable fonts
});
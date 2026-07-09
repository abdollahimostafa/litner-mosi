import type { Metadata, Viewport } from "next";
import "./globals.css";
import { iransansx } from '@/lib/fonts';

// ۱. تنظیمات متادیتا بدون viewport
export const metadata: Metadata = {
  title: "جعبه لایتنر",
  description: "سیستم ساده و مینیمال ثبت ساعت مطالعه آزمون دستیاری",
};

// ۲. اکسپورت جداگانه برای تنظیمات viewport
export const viewport: Viewport = {
    themeColor: "#10161f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // معادل همان user-scalable=no
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={iransansx.variable}>
      <body className="bg-[#F9F9F9] font-sans antialiased selection:bg-black selection:text-white">
        {/* رپیر اصلی برای محدود کردن عرض در دسکتاپ و نمایش عالی در موبایل */}
        <div className="mx-auto max-w-md min-h-screen border-x-0 sm:border-x-2 border-black bg-[#F9F9F9]">
          {children}
        </div>
      </body>
    </html>
  );
}
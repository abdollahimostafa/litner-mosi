import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const VALID_USERS = ["mostafa", "saghar"];

export function middleware(request: NextRequest) {
  const session = request.cookies.get("user_session")?.value;
  const { pathname } = request.nextUrl;

  // تمیز کردن مقدار کوکی برای بررسی دقیق
  const cleanSession = session?.toLowerCase().trim();
  const isAuthenticated = cleanSession && VALID_USERS.includes(cleanSession);

  // ۱. اگر کاربر لاگین نکرده و می‌خواهد صفحه اصلی (ریشه) را ببیند -> هدایت به /login
  if (!isAuthenticated && pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ۲. اگر کاربر لاگین کرده و می‌خواهد به صفحه /login برود -> هدایت به صفحه اصلی (ریشه)
  if (isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  /*
   * مچر را طوری تنظیم می‌کنیم که فقط روی مسیرهای اصلی اعمال شود
   * و فایل‌های استاتیک داخل public (مثل فونت‌ها، تصاویر) و روت‌های api/_next را حذف کند
   */
  matcher: [
    /*
     * تطبیق با تمام مسیرها به جز مواردی که با عبارات زیر شروع می‌شوند:
     * - api (کل روت‌های بک‌آند)
     * - _next/static (فایل‌های استاتیک نکس‌جی‌اس)
     * - _next/image (تصاویر بهینه‌شده)
     * - favicon.ico (آیکون سایت)
     * - fonts (پوشه فونت محلی شما در public)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|fonts).*)",
  ],
};
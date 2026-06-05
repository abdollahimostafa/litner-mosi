import { NextResponse } from "next/server";

const VALID_USERS = ["mostafa", "saghar"];

export async function POST(request: Request) {
  try {
    const { username } = await request.json();
    const cleanUsername = username?.toLowerCase().trim();

    if (!VALID_USERS.includes(cleanUsername)) {
      return NextResponse.json({ error: "کاربر مجاز نیست" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, user: cleanUsername });
    
    // ست کردن کوکی طولانی‌مدت (مثلاً برای ۱۰ سال) بدون انقضا برای راحتی کار روی موبایل
    response.cookies.set("user_session", cleanUsername, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 Years
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(false);

    if (!username) return;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("دسترسی رد شد. نام کاربری اشتباه است.");
      }
    } catch {
      setError("خطا در برقراری ارتباط.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-[#FAFAFA]" dir="rtl">
      <div className="w-full max-w-sm border border-black bg-white p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-tight text-black">ورود به سیستم</h1>
          <p className="text-xs text-neutral-500 mt-1">شناسه خود را وارد کنید.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="نام کاربری (mostafa / saghar)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-white border border-neutral-300 focus:border-black rounded-none focus:outline-none text-sm transition-colors"
            />
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-black text-white text-sm font-bold rounded-none hover:bg-neutral-900 transition-colors"
          >
            {loading ? "تایید شناسه..." : "ورود"}
          </button>
        </form>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TOPICS = [
  "داخلی", "جراحی", "اطفال", "زنان و زایمان", 
  "روانپزشکی", "عفونی", "نورولوژی", "قلب", 
  "فارماکولوژی", "ارکانی و بیهوشی", "پوست و رادیو", "آمار و اپیدمی"
];

const INITIAL_WEEK_PERFORMANCE = [
  { day: "شنبه", hours: 4.0, date: "۹ خرداد" },
  { day: "یکشنبه", hours: 6.5, date: "۱۰ خرداد" },
  { day: "دوشنبه", hours: 0.0, date: "۱۱ خرداد" },
  { day: "سه‌شنبه", hours: 8.0, date: "۱۲ خرداد" },
  { day: "چهارشنبه", hours: 5.5, date: "۱۳ خرداد" },
  { day: "پنجشنبه", hours: 3.0, date: "۱۴ خرداد" },
  { day: "جمعه", hours: 9.5, date: "۱۵ خرداد" },
];

const toPersianDigits = (num: string | number) => {
  const id = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const pd = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/[0-9]/g, (w) => pd[id.indexOf(w)]);
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"history" | "add" | "timer">("history");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [hours, setHours] = useState("");
  const [currentUser, setCurrentUser] = useState<"mostafa" | "saghar">("mostafa");
  const [logs, setLogs] = useState<any[]>([]);
  const [weekPerformance, setWeekPerformance] = useState(INITIAL_WEEK_PERFORMANCE);

  const [time, setTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const getCookie = (name: string) => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return null;
    };

    const sessionUser = getCookie("user_session");
    if (sessionUser === "mostafa" || sessionUser === "saghar") {
      setCurrentUser(sessionUser);
    }

    setLogs([
      { id: "1", topic: "داخلی", hours: 4.5, date: "امروز", user: "mostafa" },
      { id: "2", topic: "جراحی", hours: 3.0, date: "امروز", user: "saghar" },
      { id: "3", topic: "اطفال", hours: 5.0, date: "امروز", user: "mostafa" },
      { id: "4", topic: "زنان و زایمان", hours: 2.5, date: "امروز", user: "saghar" },
    ]);
  }, []);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    return toPersianDigits(`${hrs}:${mins}:${secs}`);
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic || !hours) return;

    const newLog = {
      id: Date.now().toString(),
      topic: selectedTopic,
      hours: parseFloat(hours),
      date: "امروز",
      user: currentUser
    };

    setLogs([newLog, ...logs]);
    
    if (weekPerformance.length > 0) {
      const updatedWeek = [...weekPerformance];
      updatedWeek[updatedWeek.length - 1].hours += parseFloat(hours);
      setWeekPerformance(updatedWeek);
    }

    setSelectedTopic("");
    setHours("");
    setActiveTab("history");
  };

  const handleTransferTimerToInput = () => {
    const calculatedHours = (time / 3600).toFixed(1);
    setHours(calculatedHours);
    setIsTimerRunning(false);
    setActiveTab("add");
  };

  const quickAddHours = (amount: number) => {
    const current = parseFloat(hours) || 0;
    setHours((current + amount).toString());
  };

  const filteredLogs = logs.filter((log) => log.user === currentUser);
  
  const todayTotalHours = filteredLogs
    .filter((log) => log.date === "امروز")
    .reduce((sum, log) => sum + log.hours, 0);

  const isMostafa = currentUser === "mostafa";
  
  // پالت رنگ اختصاصی (سبز برای مصطفی، صورتی رُز برای ساغر)
  const userColorClass = isMostafa ? "bg-[#0D5236]" : "bg-[#DB2777]";
  const userTextColorClass = isMostafa ? "text-[#0D5236]" : "text-[#DB2777]";
  const userBgLightClass = isMostafa ? "bg-[#0D5236]/10" : "bg-[#DB2777]/10";
  const timerRingClass = isMostafa ? "ring-green-100" : "ring-pink-100";

  const getTileBg = (hrs: number) => {
    if (hrs === 0) return "bg-neutral-100 text-neutral-400";
    if (hrs < 4) return isMostafa ? "bg-[#0D5236]/15 text-[#0D5236]" : "bg-[#DB2777]/15 text-[#DB2777]";
    if (hrs < 7) return isMostafa ? "bg-[#0D5236]/40 text-[#0D5236]" : "bg-[#DB2777]/40 text-[#DB2777]";
    return isMostafa ? "bg-[#0D5236] text-white" : "bg-[#DB2777] text-white";
  };

  return (
    <div className="min-h-screen bg-[#F9F8F4] text-[#2C2A27] flex flex-col relative pb-36" dir="rtl">
      
      {/* ─── PREMIUM SMOOTH HEADER ─── */}
      <header className="p-6 flex justify-between items-center bg-white/70 backdrop-blur-md sticky top-0 z-10 max-w-md mx-auto w-full border-b border-[#EAE8E2]/60">
        <div>
          <span className="text-[9px] font-bold tracking-widest text-neutral-400 block uppercase">RESIDENCY JOURNAL</span>
          <h1 className="text-lg font-bold text-[#1C1B19] mt-0.5">میز مطالعه من</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all ${userBgLightClass} ${userTextColorClass}`}>
            {isMostafa ? "مصطفی" : "ساغر"}
          </div>
        </div>
      </header>

      {/* ─── MAIN APP CONTAINER ─── */}
      <main className="flex-grow p-5 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: HISTORY & PERFORMANCE */}
          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* کارت عملکرد امروز همراه با آیکون روند ترند در چپ */}
              <div className="bg-white p-5 border border-[#EAE8E3]/80 relative overflow-hidden flex justify-between items-center">
                <div className={`absolute top-0 right-0 w-2 h-full ${userColorClass}`} />
                <div>
                  <span className="text-xs font-medium text-neutral-400 block">میزان مطالعه امروز شما</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className={`text-4xl font-black font-mono ${userTextColorClass}`}>
                      {toPersianDigits(todayTotalHours.toFixed(1))}
                    </span>
                    <span className="text-xs text-neutral-400">ساعت</span>
                  </div>
                </div>
                {/* آیکون ترند صعودی مینی‌مال */}
                <div className={`p-3 rounded-xl ${userBgLightClass} ${userTextColorClass}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                </div>
              </div>

              {/* بخش تایل‌های عملکرد ۷ روز گذشته (۴ در بالا، ۳ در پایین وسط‌چین) */}
              <div className="bg-white p-5 border border-[#EAE8E2]/50 shadow-sm space-y-4">
                <div className="flex items-center justify-between px-0.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">وضعیت عملکرد ۷ روز گذشته</h3>
                  <span className="text-[10px] text-neutral-400 font-medium">مجموع کل هفته</span>
                </div>
                
                <div className="space-y-2">
                  {/* ردیف اول: ۴ تایل اول */}
                  <div className="grid grid-cols-4 gap-2">
                    {weekPerformance.slice(0, 4).map((perf, index) => (
                      <div 
                        key={index} 
                        className={`p-2.5 h-20 rounded-sm flex flex-col items-center justify-center border border-black/5 text-center transition-all ${getTileBg(perf.hours)}`}
                      >
                        <span className="text-[10px] font-bold block opacity-80">{perf.day}</span>
                        <span className="text-sm font-black font-mono block mt-1">
                          {perf.hours > 0 ? toPersianDigits(perf.hours.toFixed(1)) : toPersianDigits(0)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* ردیف دوم: ۳ تایل آخر متمرکز در وسط */}
                  <div className="flex justify-center gap-2 w-full">
                    {weekPerformance.slice(4, 7).map((perf, index) => (
                      <div 
                        key={index} 
                        className={`p-2.5 h-20 rounded-sm flex flex-col items-center justify-center border border-black/5 text-center transition-all w-[23%] ${getTileBg(perf.hours)}`}
                      >
                        <span className="text-[10px] font-bold block opacity-80">{perf.day}</span>
                        <span className="text-sm font-black font-mono block mt-1">
                          {perf.hours > 0 ? toPersianDigits(perf.hours.toFixed(1)) : toPersianDigits(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* لیست گزارش‌های امروز */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">گزارش‌های ثبت‌شده امروز</h3>
                
                <div className="space-y-2.5">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-6 text-xs text-neutral-400 bg-white rounded-md border border-dashed border-[#EAE8E2]">
                      هیچ رکوردی برای امروز ثبت نشده است.
                    </div>
                  ) : (
                    filteredLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className="bg-white p-4 rounded-lg border border-[#EAE8E2]/40 shadow-sm flex justify-between items-center hover:bg-neutral-50/50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-8 rounded-full ${userColorClass}`} />
                          <div>
                            <h4 className="text-sm font-bold text-[#2C2A27]">{log.topic}</h4>
                            <span className="text-[10px] text-neutral-400 block mt-0.5 font-medium">{log.date}</span>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-base font-bold font-mono text-[#1C1B19] block">
                            {toPersianDigits(log.hours)} ساعت
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: CLEAN INPUT FORM */}
          {activeTab === "add" && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-6 rounded-2xl border border-[#EAE8E2]/50 shadow-sm space-y-6"
            >
              <form onSubmit={handleAddLog} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-3">۱. انتخاب مبحث دستیاری</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TOPICS.map((topic) => {
                      const isSelected = selectedTopic === topic;
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => setSelectedTopic(topic)}
                          className={`p-3 text-right text-xs rounded-xl border transition-all ${
                            isSelected 
                              ? "bg-[#2C2A27] text-white border-[#2C2A27] shadow-sm font-bold" 
                              : "bg-[#FBFBFA] text-[#2C2A27] border-[#EAE8E2] hover:border-[#2C2A27]"
                          }`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* بهبود کامل بخش انتخاب زمان با دکمه‌های کپسولی سریع */}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-2.5">۲. مدت زمان مطالعه</label>
                  <div className="space-y-3">
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        step="0.5"
                        placeholder="0.0"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        className="w-full p-4 bg-[#FBFBFA] border border-[#EAE8E2] focus:border-[#2C2A27] rounded-xl focus:outline-none font-mono text-left text-sm font-bold pl-16 transition-all"
                      />
                      <span className="absolute left-4 text-xs font-bold text-neutral-400 pointer-events-none">ساعت</span>
                    </div>
                    
                    {/* دکمه‌های کپسولی میانبر زمان */}
                    <div className="grid grid-cols-3 gap-2">
                      {[0.5, 1.0, 2.0].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => quickAddHours(amount)}
                          className="py-2.5 text-xs font-bold bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-700 font-mono transition-all"
                        >
                          +{toPersianDigits(amount)} ساعت
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full p-4 bg-[#2C2A27] text-white text-xs font-bold uppercase rounded-xl hover:bg-neutral-800 transition-all shadow-md active:scale-[0.99]"
                >
                  ذخیره و آپدیت بورد
                </button>
              </form>
            </motion.div>
          )}

          {/* TAB 3: MINIMALIST CHRONO TIMER */}
          {activeTab === "timer" && (
            <motion.div
              key="timer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 flex flex-col items-center justify-center pt-4"
            >
              <div className="w-full bg-white p-8 rounded-2xl border border-[#EAE8E2]/50 shadow-sm text-center flex flex-col items-center justify-center">
                <span className="text-[9px] font-bold tracking-widest text-neutral-400 uppercase block mb-6">LIVE SESSION</span>
                
                <div className={`w-48 h-48 rounded-full border-2 border-neutral-100 flex flex-col items-center justify-center bg-[#FBFBFA] relative shadow-inner transition-all duration-500 ${isTimerRunning ? `ring-8 ${timerRingClass}` : ""}`}>
                  <div className="text-4xl font-black font-mono tracking-tight text-[#1C1B19]">
                    {formatTime(time)}
                  </div>
                  {isTimerRunning && (
                    <span className="text-[9px] text-green-600 font-bold mt-1 tracking-wider animate-pulse">در حال ذخیره زمان...</span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 w-full mt-8">
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`p-3.5 text-xs font-bold rounded-xl transition-all shadow-sm text-white ${userColorClass}`}
                  >
                    {isTimerRunning ? "توقف موقت" : "شروع تایمر"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsTimerRunning(false); setTime(0); }}
                    className="p-3.5 text-xs font-bold rounded-xl border border-[#EAE8E2] bg-[#FBFBFA] text-[#2C2A27] hover:bg-neutral-50"
                  >
                    ریست زمان
                  </button>
                </div>
              </div>

              {time > 5 && (
                <button
                  type="button"
                  onClick={handleTransferTimerToInput}
                  className="w-full p-3.5 bg-white border border-[#EAE8E2] rounded-xl text-xs font-bold text-[#2C2A27] shadow-sm hover:bg-neutral-50 transition-all text-center flex items-center justify-center gap-1"
                >
                  <span>ثبت این زمان درون کارنامه</span>
                  <span className="text-neutral-400 font-mono">({toPersianDigits((time / 3600).toFixed(1))}h)</span>
                </button>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ─── FLOATING FULL-WIDTH ISLAND BOTTOM NAV ─── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-transparent z-20 max-w-md mx-auto w-full">
        <nav className="bg-white/90 backdrop-blur-md border border-[#EAE8E2]/70 shadow-xl h-20 px-2 flex items-center w-full rounded-2xl">
          <div className="w-full grid grid-cols-3 h-14">
            
            <button
              onClick={() => setActiveTab("history")}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                activeTab === "history" ? "text-[#1C1B19] font-bold" : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              <span className="text-[13px]">کارنامه</span>
            </button>

            <button
              onClick={() => setActiveTab("add")}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                activeTab === "add" ? "text-[#1C1B19] font-bold" : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-[13px]">ثبت دستی</span>
            </button>

            <button
              onClick={() => setActiveTab("timer")}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl transition-all relative ${
                activeTab === "timer" ? "text-[#1C1B19] font-bold" : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[13px] flex items-center gap-1">
                تایمر
                {isTimerRunning && <span className={`w-1.5 h-1.5 rounded-full animate-ping ${userColorClass}`} />}
              </span>
            </button>

          </div>
        </nav>
      </div>
    </div>
  );
}
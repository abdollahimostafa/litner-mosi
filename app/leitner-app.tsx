'use client';

/**
 * جعبه لایتنر — دستیار مرور رزیدنتی (نسخه Prisma)
 * ------------------------------------------------------------------
 * داده‌ها دیگه توی localStorage نیستن؛ از سرور (Prisma) میان و با
 * Server Action ها تغییر می‌کنن. بعد از هر تغییر، revalidatePath('/')
 * توی actions.ts باعث می‌شه سرور دوباره items تازه رو بفرسته و این
 * کامپوننت خودکار با داده‌ی جدید رندر بشه.
 * ------------------------------------------------------------------
 */
import type {  ReactElement } from "react";
import { useState, useEffect, useMemo, useTransition, type SVGProps } from 'react';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import 'react-multi-date-picker/styles/backgrounds/bg-dark.css';
import type { CardItem as PrismaCardItem, HistoryEntry as PrismaHistoryEntry } from '@prisma/client';
import { createCard, markCardDone, postponeCard, deleteCard } from './actions';

// ----------------------------- انواع -----------------------------

type CardItem = PrismaCardItem & { history: PrismaHistoryEntry[] };
type HistoryAction = 'created' | 'done' | 'postponed' | 'restarted';
type Tab = 'dashboard' | 'add' | 'previous';

// ----------------------------- ثابت‌ها -----------------------------

const TOPICS = [
  'جراحی', 'اطفال', 'زنان',
  'داخلی - قلب', 'داخلی - روماتولوژی', 'داخلی - ریه', 'داخلی - گوارش', 'داخلی - نفرولوژی', 'داخلی - غدد',
  'داخلی - هماتولوژی', 'ارتوپدی', 'ارولوژی', 'پوست', 'پاتولوژی',
  'روانپزشکی', 'عفونی', 'نورولوژی', 'چشم',
  'فارماکولوژی', 'ENT', 'رادیو', 'آمار و اپیدمی',
];

const STEPS = [1, 3, 7, 14, 30]; // فاصله‌های جعبه لایتنر بر حسب روز

// ----------------------------- کمکی‌ها -----------------------------

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayISO() {
  return toISODate(new Date());
}

function diffDays(a: Date, b: Date) {
  const aMid = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bMid = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((bMid - aMid) / 86400000);
}

// مبدل همه‌جانبه اعداد انگلیسی به فارسی (حتی در داخل متن)
function faDigits(val: number | string): string {
  if (val === undefined || val === null) return '';
  return String(val).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
}

function formatJalali(d: Date, withWeekday = false): string {
  return new Intl.DateTimeFormat('fa-IR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withWeekday ? { weekday: 'long' } : {}),
  }).format(d);
}

// ----------------------------- آیکون‌ها -----------------------------

function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function CalendarGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 11.5L12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function ListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 6h12M9 12h12M9 18h12" />
      <circle cx="4" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

const ACTION_META: Record<HistoryAction, { label: string; color: string }> = {
  created: { label: 'شروع مطالعه', color: '#9BA3B4' },
  done: { label: 'مرور موفق', color: '#6FAE8C' },
  postponed: { label: 'عقب افتاد', color: '#D9695A' },
  restarted: { label: 'دور جدید شروع شد', color: '#DFA94A' },
};

// ----------------------------- ردیاب مرحله -----------------------------

function StepTracker({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((s, i) => {
        const state = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'upcoming';
        return (
          <div key={s} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={
                'h-2.5 w-full rounded-full transition-colors ' +
                (state === 'active'
                  ? 'bg-[#DFA94A]'
                  : state === 'done'
                  ? 'bg-[#6FAE8C]/60'
                  : 'bg-[#2C3852]')
              }
            />
            <span className={'text-[10px] ' + (state === 'active' ? 'font-bold text-[#DFA94A]' : 'text-[#5C6478]')}>
              {faDigits(s)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ----------------------------- کارت هر مورد -----------------------------

function DueCard({
  item,
  today,
  pending,
  onDone,
  onPostpone,
  onHistory,
}: {
  item: CardItem;
  today: string;
  pending: boolean;
  onDone: (id: string) => void;
  onPostpone: (id: string) => void;
  onHistory: (id: string) => void;
}) {
  const overdueDays = diffDays(item.nextReview, new Date(today + 'T00:00:00'));
  const isOverdue = overdueDays > 0;

  return (
    <div className="relative rounded-2xl border border-[#2C3852] bg-[#1A2230] p-4 pt-5">
      <span className="absolute -top-1 right-6 h-2 w-10 rounded-full bg-[#DFA94A]" aria-hidden />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-[#EDE7DA]">{item.topic}</h3>
          <p className="mt-0.5 text-xs text-[#9BA3B4]">
            فصل {faDigits(item.chapter)}
            {item.cycleCount > 0 && <span className="text-[#DFA94A]"> · دور {faDigits(item.cycleCount + 1)}</span>}
          </p>
        </div>
        {isOverdue && (
          <span className="shrink-0 rounded-full bg-[#D9695A]/15 px-2 py-1 text-[10px] font-bold text-[#D9695A]">
            {faDigits(overdueDays)} روز عقب افتاده
          </span>
        )}
      </div>

      <div className="mt-4">
        <StepTracker stepIndex={item.stepIndex} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => onHistory(item.id)}
          aria-label="تاریخچه این مبحث"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#2C3852] text-[#9BA3B4] transition hover:border-[#3A4459] hover:text-[#EDE7DA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DFA94A]"
        >
          <ClockIcon className="h-4 w-4" />
        </button>
        <button
          disabled={pending}
          onClick={() => onPostpone(item.id)}
          className="h-9 flex-1 rounded-xl border border-[#2C3852] text-sm font-semibold text-[#B9C0CE] transition hover:bg-[#212B3B] active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DFA94A]"
        >
          فردا یادم بنداز
        </button>
        <button
          disabled={pending}
          onClick={() => onDone(item.id)}
          className="h-9 flex-1 rounded-xl bg-[#DFA94A] text-sm font-bold text-[#1A1305] transition hover:bg-[#EDBB5E] active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DFA94A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A2230]"
        >
          مرور شد
        </button>
      </div>
    </div>
  );
}

// ----------------------------- فرم افزودن با تقویم شمسی react-multi-date-picker -----------------------------

function AddForm({
  onAdd,
  pending,
}: {
  onAdd: (topic: string, chapter: string, date: Date, step: number) => void;
  pending: boolean;
}) {
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [chapter, setChapter] = useState('');
  const [step, setStep] = useState<number>(STEPS[0]);
  const [error, setError] = useState<string | null>(null);
  const [readDate, setReadDate] = useState<DateObject>(
    new DateObject({ calendar: persian, locale: persian_fa })
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!topic) {
      setError('یک مبحث انتخاب کن');
      return;
    }
    if (!chapter.trim()) {
      setError('نام یا شماره فصل را وارد کن');
      return;
    }

    setError(null);
    onAdd(topic, chapter, readDate.toDate(), step);
    setChapter('');
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#9BA3B4]">مبحث</label>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{ colorScheme: 'dark' }}
          className="w-full rounded-xl border border-[#2C3852] bg-[#1A2230] px-4 py-3 text-sm text-[#EDE7DA] outline-none focus:border-[#DFA94A]"
        >
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold text-[#9BA3B4]">شماره یا عنوان فصل</label>
        <input
          type="text"
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
          placeholder="مثلاً ۵ یا غدد صماخی"
          className="w-full rounded-xl border border-[#2C3852] bg-[#1A2230] px-4 py-3 text-sm text-[#EDE7DA] outline-none placeholder:text-[#5C6478] focus:border-[#DFA94A]"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold text-[#9BA3B4]">چه روزی مطالعه کردی؟ (تاریخ شمسی)</label>
        <DatePicker
          value={readDate}
          onChange={(d) => {
            if (d && !Array.isArray(d)) setReadDate(d as DateObject);
          }}
          calendar={persian}
          locale={persian_fa}
          calendarPosition="bottom-right"
          maxDate={new Date()}
          className="bg-dark"
          containerClassName="w-full"
          render={(_value, openCalendar) => (
            <button
              type="button"
              onClick={openCalendar}
              className="flex w-full items-center justify-between rounded-xl border border-[#2C3852] bg-[#1A2230] px-4 py-3 text-sm text-[#EDE7DA] outline-none transition hover:bg-[#212B3B] focus-visible:border-[#DFA94A]"
            >
              <span>{faDigits(formatJalali(readDate.toDate()))}</span>
              <CalendarGlyph className="h-4 w-4 text-[#9BA3B4]" />
            </button>
          )}
        />
        <p className="mt-1.5 text-[11px] text-[#5C6478]">برای ثبت مطالعه‌های قبلی، تاریخ رو عقب‌تر ببر</p>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold text-[#9BA3B4]">الان تو کدوم مرحله لایتنره؟</label>
        <div className="grid grid-cols-5 gap-1.5">
          {STEPS.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setStep(s)}
              className={
                'rounded-lg py-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DFA94A] ' +
                (step === s ? 'bg-[#DFA94A] text-[#1A1305]' : 'border border-[#2C3852] bg-[#1A2230] text-[#9BA3B4]')
              }
            >
              {faDigits(s)}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-[#5C6478]">برای مطلب تازه «۱» رو انتخاب کن</p>
      </div>

      {error && <p className="text-xs font-semibold text-[#D9695A]">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[#DFA94A] py-3.5 text-sm font-bold text-[#1A1305] transition hover:bg-[#EDBB5E] active:scale-[0.99] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DFA94A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10161F]"
      >
        {pending ? 'در حال افزودن...' : 'افزودن به جعبه'}
      </button>

      {/* تم رنگی تقویم برای هماهنگی با پالت طلایی/سرمه‌ای اپ */}
      <style jsx global>{`
        .rmdp-wrapper {
          background: #1a2230 !important;
          border: 1px solid #2c3852 !important;
          border-radius: 14px !important;
        }
        .rmdp-calendar {
          background: #1a2230 !important;
        }
        .rmdp-day-picker > div {
          background: #1a2230 !important;
        }
        .rmdp-header-values {
          color: #ede7da !important;
        }
        .rmdp-week-day {
          color: #9ba3b4 !important;
        }
        .rmdp-day span {
          color: #ede7da !important;
        }
        .rmdp-day.rmdp-disabled span {
          color: #5c6478 !important;
        }
        .rmdp-day.rmdp-today span {
          background: transparent !important;
          border: 1px solid #dfa94a !important;
          color: #dfa94a !important;
        }
        .rmdp-day.rmdp-selected span:not(.highlight) {
          background-color: #dfa94a !important;
          color: #1a1305 !important;
          box-shadow: none !important;
        }
        .rmdp-day:not(.rmdp-disabled):not(.rmdp-day-hidden) span:hover {
          background-color: #212b3b !important;
          color: #ede7da !important;
        }
        .rmdp-arrow {
          border-color: #9ba3b4 !important;
        }
        .rmdp-arrow-container:hover {
          background-color: #212b3b !important;
          box-shadow: none !important;
        }
        .rmdp-arrow-container:hover .rmdp-arrow {
          border-color: #dfa94a !important;
        }
      `}</style>
    </form>
  );
}

// ----------------------------- مودال تاریخچه‌ی یک کارت -----------------------------

function HistoryModal({
  item,
  pending,
  onClose,
  onDelete,
}: {
  item: CardItem;
  pending: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...item.history].reverse();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-[#2C3852] bg-[#161D29] p-5 pb-8"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#2C3852]" />

        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-[#EDE7DA]">{item.topic}</h3>
            <p className="mt-0.5 text-xs text-[#9BA3B4]">فصل {faDigits(item.chapter)} · تاریخچه مرور</p>
          </div>
          <button
            onClick={onClose}
            aria-label="بستن"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#9BA3B4] transition hover:bg-[#212B3B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DFA94A]"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <ol className="mt-5">
          {sorted.map((h, idx) => (
            <li key={h.id} className="relative pb-5 pr-6 last:pb-0">
              <span
                className="absolute right-0 top-1 h-2.5 w-2.5 rounded-full"
                style={{ background: ACTION_META[h.action as HistoryAction].color }}
              />
              {idx !== sorted.length - 1 && <span className="absolute bottom-0 right-[4.5px] top-3.5 w-px bg-[#2C3852]" />}
              <p className="text-sm font-semibold text-[#EDE7DA]">{ACTION_META[h.action as HistoryAction].label}</p>
              <p className="mt-0.5 text-xs text-[#9BA3B4]">
                {faDigits(formatJalali(h.date))} · مرحله {faDigits(h.stepDays)} روزه
              </p>
            </li>
          ))}
        </ol>

        <button
          disabled={pending}
          onClick={() => {
            if (confirm('این مورد برای همیشه حذف بشه؟')) onDelete(item.id);
          }}
          className="mt-4 w-full rounded-xl border border-[#D9695A]/30 py-3 text-xs font-bold text-[#D9695A] transition hover:bg-[#D9695A]/10 disabled:opacity-50"
        >
          حذف این مورد
        </button>
      </div>
    </div>
  );
}

// ----------------------------- تب «مرورهای قبلی» -----------------------------

function PreviousReadsTab({ items }: { items: CardItem[] }) {
  const [filterTopic, setFilterTopic] = useState<string>('all');

  const entries = useMemo(() => {
    const flat = items.flatMap((item) =>
      item.history.map((h) => ({
        id: h.id,
        date: h.date,
        action: h.action as HistoryAction,
        stepDays: h.stepDays,
        topic: item.topic,
        chapter: item.chapter,
      }))
    );
    const filtered = filterTopic === 'all' ? flat : flat.filter((e) => e.topic === filterTopic);
    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [items, filterTopic]);

  const usedTopics = useMemo(() => {
    const set = new Set(items.map((i) => i.topic));
    return TOPICS.filter((t) => set.has(t));
  }, [items]);

  return (
    <section className="mx-auto mt-2 max-w-md px-5">
      <div className="mb-4">
        <label className="mb-2 block text-xs font-semibold text-[#9BA3B4]">فیلتر بر اساس مبحث</label>
        <select
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value)}
          style={{ colorScheme: 'dark' }}
          className="w-full rounded-xl border border-[#2C3852] bg-[#1A2230] px-4 py-3 text-sm text-[#EDE7DA] outline-none focus:border-[#DFA94A]"
        >
          <option value="all">همه مباحث ({faDigits(items.length)} مورد)</option>
          {usedTopics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-3xl border border-[#2C3852] bg-[#1A2230] p-6 text-center">
          <p className="text-4xl">🗒️</p>
          <p className="mt-2 text-sm font-semibold text-[#B9C0CE]">
            {filterTopic === 'all' ? 'هنوز مروری ثبت نشده' : 'برای این مبحث موردی ثبت نشده'}
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="rounded-2xl border border-[#2C3852] bg-[#1A2230] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-[#EDE7DA]">{e.topic}</p>
                  <p className="mt-0.5 text-xs text-[#9BA3B4]">فصل {faDigits(e.chapter)}</p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold"
                  style={{ background: ACTION_META[e.action].color + '26', color: ACTION_META[e.action].color }}
                >
                  {ACTION_META[e.action].label}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-[#5C6478]">
                {faDigits(formatJalali(e.date))} · مرحله {faDigits(e.stepDays)} روزه
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

// ----------------------------- ناوبری پایین -----------------------------

function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const items: { key: Tab; label: string; Icon: (p: SVGProps<SVGSVGElement>) => ReactElement }[] = [
    { key: 'dashboard', label: 'داشبورد', Icon: HomeIcon },
    { key: 'add', label: 'افزودن', Icon: PlusIcon },
    { key: 'previous', label: 'مرورهای قبلی', Icon: ListIcon },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#2C3852] bg-[#12181F]/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {items.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex flex-col items-center gap-1 px-5 py-1.5 focus-visible:outline-none"
          >
            <Icon className={'h-5 w-5 ' + (tab === key ? 'text-[#DFA94A]' : 'text-[#5C6478]')} />
            <span className={'text-[11px] font-semibold ' + (tab === key ? 'text-[#DFA94A]' : 'text-[#5C6478]')}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ----------------------------- صفحه اصلی -----------------------------

export default function LeitnerApp({ items }: { items: CardItem[] }) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const today = todayISO();
  const historyItem = items.find((i) => i.id === historyItemId) ?? null;

  const dueItems = useMemo(() => {
    return items
      .filter((i) => toISODate(i.nextReview) <= today)
      .sort((a, b) => {
        const an = toISODate(a.nextReview);
        const bn = toISODate(b.nextReview);
        return an === bn ? a.topic.localeCompare(b.topic, 'fa') : an < bn ? -1 : 1;
      });
  }, [items, today]);

  const upcomingCount = items.length - dueItems.length;

  const nextUpcoming = useMemo(() => {
    const future = items
      .filter((i) => toISODate(i.nextReview) > today)
      .sort((a, b) => (a.nextReview < b.nextReview ? -1 : 1));
    return future[0] ?? null;
  }, [items, today]);

  function handleAdd(topic: string, chapter: string, date: Date, step: number) {
    startTransition(async () => {
      await createCard(topic, chapter, date, step);
      setToast('به جعبه اضافه شد ✅');
      setTab('dashboard');
    });
  }

  function handleDone(id: string) {
    startTransition(async () => {
      await markCardDone(id);
      setToast('عالی بود، مرور بعدی ثبت شد 🎯');
    });
  }

  function handlePostpone(id: string) {
    startTransition(async () => {
      await postponeCard(id);
      setToast('فردا دوباره یادت می‌ندازیم ⏳');
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteCard(id);
      setHistoryItemId(null);
    });
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#10161F] pb-28 text-[#EDE7DA]">
      <header className="mx-auto max-w-md px-5 pb-2 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-[#5C6478]">دستیار مرور رزیدنتی</p>
            <h1 style={{ fontFamily: 'var(--font-lalezar)' }} className="text-2xl text-[#EDE7DA]">
              جعبه لایتنر
            </h1>
          </div>
          <div className="text-left">
            <p className="text-[11px] text-[#5C6478]">امروز</p>
            <p className="text-xs font-semibold text-[#9BA3B4]">{faDigits(formatJalali(new Date(), true))}</p>
          </div>
        </div>
      </header>

      {tab === 'dashboard' && (
        <section className="mx-auto max-w-md px-5">
          <div className="mt-2 rounded-3xl border border-[#2C3852] bg-gradient-to-br from-[#1A2230] to-[#161D29] p-6 text-center">
            {dueItems.length > 0 ? (
              <>
                <p style={{ fontFamily: 'var(--font-lalezar)' }} className="text-6xl leading-none text-[#DFA94A]">
                  {faDigits(dueItems.length)}
                </p>
                <p className="mt-2 text-sm font-semibold text-[#B9C0CE]">مورد برای مرور امروز</p>
                {upcomingCount > 0 && (
                  <p className="mt-3 text-[11px] text-[#5C6478]">{faDigits(upcomingCount)} مورد دیگه در صف انتظارن</p>
                )}
              </>
            ) : items.length > 0 ? (
              <>
                <p className="text-4xl">🎉</p>
                <p className="mt-2 text-sm font-semibold text-[#B9C0CE]">امروز چیزی برای مرور نداری</p>
                {nextUpcoming && (
                  <p className="mt-3 text-[11px] text-[#5C6478]">
                    مرور بعدی: {nextUpcoming.topic} · {faDigits(formatJalali(nextUpcoming.nextReview))}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-4xl">🗂️</p>
                <p className="mt-2 text-sm font-semibold text-[#B9C0CE]">هنوز موردی اضافه نکردی</p>
                <p className="mt-1 text-[11px] text-[#5C6478]">از تب «افزودن» شروع کن</p>
              </>
            )}
          </div>

          <div className="mt-6 space-y-3">
            {dueItems.map((item) => (
              <DueCard
                key={item.id}
                item={item}
                today={today}
                pending={isPending}
                onDone={handleDone}
                onPostpone={handlePostpone}
                onHistory={setHistoryItemId}
              />
            ))}
          </div>
        </section>
      )}

      {tab === 'add' && (
        <section className="mx-auto mt-2 max-w-md px-5">
          <div className="rounded-3xl border border-[#2C3852] bg-[#1A2230] p-6">
            <AddForm onAdd={handleAdd} pending={isPending} />
          </div>
        </section>
      )}

      {tab === 'previous' && <PreviousReadsTab items={items} />}

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-5">
          <div className="rounded-full bg-[#EDE7DA] px-5 py-2.5 text-xs font-bold text-[#161D29] shadow-lg">{toast}</div>
        </div>
      )}

      {historyItem && (
        <HistoryModal item={historyItem} pending={isPending} onClose={() => setHistoryItemId(null)} onDelete={handleDelete} />
      )}

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
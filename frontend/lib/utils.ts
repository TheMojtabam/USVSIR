import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toFa(num: number | string): string {
  const map = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, d => map[+d]);
}

// تبدیل میلادی به جلالی (شمسی)
function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const jy = (gy <= 1600) ? 0 : 979;
  gy = (gy <= 1600) ? gy - 621 : gy - 1600;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  let jyR = jy + 33 * Math.floor(days / 12053);
  days %= 12053;
  jyR += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jyR += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return [jyR, jm, jd];
}

const J_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

// ساعت تهران (UTC+3:30) از یک Date
function toTehran(d: Date): Date {
  // ایران: UTC+3:30 (در زمستان) یا UTC+4:30 (در تابستان - DST)
  // برای سادگی UTC+3:30 (ایران از 2022 DST رو حذف کرده)
  return new Date(d.getTime() + (3.5 * 60 * 60 * 1000));
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 30) return 'لحظاتی پیش';
  if (seconds < 60) return `${toFa(seconds)} ثانیه پیش`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${toFa(minutes)} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${toFa(hours)} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${toFa(days)} روز پیش`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${toFa(months)} ماه پیش`;
  return `${toFa(Math.floor(months / 12))} سال پیش`;
}

// زمان به وقت تهران HH:MM
export function formatTimeIR(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const t = toTehran(d);
  const h = String(t.getUTCHours()).padStart(2, '0');
  const m = String(t.getUTCMinutes()).padStart(2, '0');
  return toFa(`${h}:${m}`);
}

// تاریخ شمسی به وقت تهران: 11 اردیبهشت 1405
export function formatDateFa(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const t = toTehran(d);
  const [jy, jm, jd] = gregorianToJalali(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
  return `${toFa(jd)} ${J_MONTHS[jm - 1]} ${toFa(jy)}`;
}

// تاریخ + زمان شمسی: 11 اردیبهشت 1405 · 14:30
export function formatDateTimeFa(date: string | Date): string {
  return `${formatDateFa(date)} · ${formatTimeIR(date)}`;
}

export function nowJalali(): { date: string; time: string } {
  const now = new Date();
  return { date: formatDateFa(now), time: formatTimeIR(now) };
}

export const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
};

// API base path - in production via nginx, otherwise local
export const API = '/api';

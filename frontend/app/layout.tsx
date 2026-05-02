import type { Metadata } from 'next';
import { Vazirmatn, Inter, JetBrains_Mono, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { LangProvider } from '@/lib/lang-store';

const vazir = Vazirmatn({ subsets: ['arabic', 'latin'], variable: '--font-vazir', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });
const instrument = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument', display: 'swap' });

export const metadata: Metadata = {
  title: 'Observatory · فرماندهی اطلاعات',
  description: 'OSINT War Room',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazir.variable} ${inter.variable} ${mono.variable} ${instrument.variable}`} suppressHydrationWarning>
      <body className="font-sans grain atmosphere overflow-x-hidden" suppressHydrationWarning>
        <LangProvider>
          {children}
        </LangProvider>
      </body>
    </html>
  );
}

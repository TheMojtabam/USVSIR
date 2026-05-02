'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Lang = 'all' | 'fa' | 'en' | 'ar';

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'all',
  setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('all');

  useEffect(() => {
    try {
      const v = localStorage.getItem('obs.lang') as Lang | null;
      if (v && ['all', 'fa', 'en', 'ar'].includes(v)) setLangState(v);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('obs.lang', l); } catch {}
  };

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export function useLangFilter() {
  return useContext(Ctx);
}

export function useLang() {
  return useContext(Ctx).lang;
}

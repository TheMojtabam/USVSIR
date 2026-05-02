'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function Shell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className="flex min-h-screen relative z-10">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="bg-bg-0 min-h-screen flex-1 min-w-0">
        <Topbar onMenuClick={() => setDrawerOpen(true)} />
        <div className="px-4 lg:px-8 pt-7 pb-16 max-w-[1640px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

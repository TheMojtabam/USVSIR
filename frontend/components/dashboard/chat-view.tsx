'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, FileText, Trash2 } from 'lucide-react';
import { API, toFa } from '@/lib/utils';

type Msg = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  citations?: { count: number; sources: number };
  loading?: boolean;
};

export function ChatView() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'init',
      role: 'assistant',
      text: 'سلام! می‌توانم بر اساس بانک خبر داخلی به سؤالاتت پاسخ بدم. چی می‌خوای بدونی؟',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Msg = { id: Date.now() + 'u', role: 'user', text };
    const aiId = Date.now() + 'a';
    setMessages(m => [...m, userMsg, { id: aiId, role: 'assistant', text: '', loading: true }]);
    setInput('');
    setSending(true);

    try {
      const r = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (!r.ok) throw new Error(`${r.status}`);
      const data = await r.json();

      setMessages(m =>
        m.map(msg => msg.id === aiId ? {
          ...msg,
          text: data.answer || 'پاسخی دریافت نشد',
          citations: data.citations,
          loading: false,
        } : msg)
      );
    } catch (e: any) {
      setMessages(m =>
        m.map(msg => msg.id === aiId ? {
          ...msg,
          text: 'خطا در ارتباط با سرور: ' + (e?.message || 'unknown'),
          loading: false,
        } : msg)
      );
    } finally {
      setSending(false);
    }
  }

  function clear() {
    setMessages([{ id: 'init', role: 'assistant', text: 'گفتگو پاک شد. سؤال جدید بپرس.' }]);
  }

  return (
    <div className="max-w-[880px] mx-auto flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
      <div className="flex justify-end mb-3">
        <button
          onClick={clear}
          className="text-[12px] text-ink-3 hover:text-ink-2 flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> پاک کردن گفتگو
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4">
        {messages.map(m => <Message key={m.id} msg={m} />)}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 mt-4 bg-gradient-to-b from-bg-2 to-bg-1 border border-line-2 rounded-2xl p-3 flex gap-3 items-end shadow-soft-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="مثلاً: 'در ۲۴ ساعت گذشته چه اتفاقی توی تنگه هرمز افتاده؟'"
          rows={1}
          className="flex-1 bg-transparent border-0 outline-none resize-none text-ink font-sans text-[14px] leading-7 min-h-[28px] max-h-[200px] placeholder:text-ink-3"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="bg-gradient-violet text-white px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_12px_rgba(183,148,246,0.3)]"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function Message({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse self-start max-w-[85%]' : 'self-start max-w-[85%]'}`}>
      <div className={`w-9 h-9 rounded-xl grid place-items-center font-bold text-[14px] shrink-0 shadow-soft-1 ${
        isUser ? 'bg-gradient-cyan text-bg-0' : 'bg-gradient-violet text-white'
      }`}>
        {isUser ? 'م' : 'AI'}
      </div>
      <div>
        <div className={`px-4 py-3 rounded-2xl text-[14px] leading-7 whitespace-pre-wrap ${
          isUser
            ? 'bg-gradient-to-br from-violet-deep/40 to-violet-deep/10 border border-violet/30'
            : 'bg-bg-2 border border-line-2'
        }`}>
          {msg.loading ? (
            <span className="text-ink-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Qwen 2.5 در حال جستجو در بانک خبر...
            </span>
          ) : msg.text}
        </div>
        {msg.citations && (
          <div className="mt-2 px-3 py-2 bg-bg-3 border border-line rounded-lg text-[11.5px] text-ink-3 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            <span>منابع: <strong className="text-ink-2">{toFa(msg.citations.count)} خبر</strong> · {toFa(msg.citations.sources)} منبع متمایز</span>
          </div>
        )}
      </div>
    </div>
  );
}

import { Shell } from '@/components/dashboard/shell';
import { ChatView } from '@/components/dashboard/chat-view';

export default function Page() {
  return (
    <Shell>
      <div className="mb-6">
        <div className="font-mono text-[10px] tracking-[0.18em] text-violet uppercase font-medium mb-2">RAG · QWEN 2.5 ON LOCAL DATA</div>
        <h1 className="text-[28px] font-bold tracking-tight">چت با <em className="font-serif italic font-normal gradient-text">اطلاعات</em></h1>
        <p className="text-ink-2 mt-2 text-[14px]">سؤال بپرس، پاسخ مبتنی بر بانک خبر داخلی</p>
      </div>
      <ChatView />
    </Shell>
  );
}

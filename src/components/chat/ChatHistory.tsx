import { useRef, useEffect, useCallback, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MessagesSquare } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { MessageSkeleton, EmptyState } from '@/components/global/LoadingSkeleton';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/types';

const ITEM_ESTIMATED_HEIGHT = 120;
const OVERSCAN = 5;

interface ChatHistoryProps {
  messages: readonly ChatMessageType[];
  isLoading?: boolean;
  isStreaming?: boolean;
  onCopy?: (content: string) => void;
  onRegenerate?: (messageId: string) => void;
  className?: string;
}

function ChatHistory({
  messages,
  isLoading = false,
  isStreaming = false,
  onCopy,
  onRegenerate,
  className,
}: ChatHistoryProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_ESTIMATED_HEIGHT,
    overscan: OVERSCAN,
  });

  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, {
        align: 'end',
        behavior: 'smooth',
      });
    }
  }, [messages.length, virtualizer]);

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [messages.length, isStreaming, autoScroll, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;

    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom < 100;
    setAutoScroll(isNearBottom);
  }, []);

  const handleCopy = useCallback((content: string) => {
    void navigator.clipboard.writeText(content);
    onCopy?.(content);
  }, [onCopy]);

  if (isLoading) {
    return (
      <div className={cn('flex-1', className)}>
        <MessageSkeleton count={3} />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={cn('flex h-full flex-1', className)}>
        <EmptyState
          icon={MessagesSquare}
          title="开始对话"
          description="提问关于教材内容的问题，AI 将整合多本教材的知识为你解答"
        />
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className={cn('relative flex-1', className)}>
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="content-visibility-auto h-full overflow-y-auto px-4 py-3"
      >
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualItems.map((virtualRow) => {
            const message = messages[virtualRow.index];
            if (!message) return null;

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute left-0 top-0 w-full pb-4"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <ChatMessage
                  message={message}
                  onCopy={handleCopy}
                  onRegenerate={onRegenerate}
                />
              </div>
            );
          })}
        </div>
      </div>

      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            scrollToBottom();
          }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-md transition-colors hover:bg-muted hover:text-foreground"
          aria-label="滚动到底部"
        >
          ↓ 新消息
        </button>
      )}
    </div>
  );
}

export { ChatHistory };
export type { ChatHistoryProps };

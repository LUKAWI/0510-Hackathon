import { useState, useCallback } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  RefreshCw,
  Check,
  BookOpen,
  Bot,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/types';

// ─── Types ─────────────────────────────────────────────────

interface ChatMessageProps {
  message: ChatMessageType;
  onCopy?: (content: string) => void;
  onRegenerate?: (messageId: string) => void;
  className?: string;
}

// ─── Markdown 组件样式映射 ──────────────────────────────────

const markdownComponents = {
  p: ({ children, ...props }: React.ComponentProps<'p'>) => (
    <p className="text-sm leading-relaxed [&:not(:last-child)]:mb-2" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: React.ComponentProps<'ul'>) => (
    <ul className="list-disc pl-4 text-sm [&:not(:last-child)]:mb-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.ComponentProps<'ol'>) => (
    <ol className="list-decimal pl-4 text-sm [&:not(:last-child)]:mb-2" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.ComponentProps<'li'>) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  code: ({ children, className, ...props }: React.ComponentProps<'code'>) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className={cn('block overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs', className)}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }: React.ComponentProps<'pre'>) => (
    <pre
      className="overflow-x-auto rounded-md bg-muted p-3 [&:not(:last-child)]:mb-2"
      {...props}
    >
      {children}
    </pre>
  ),
  blockquote: ({ children, ...props }: React.ComponentProps<'blockquote'>) => (
    <blockquote
      className="border-l-2 border-border pl-3 text-sm text-muted-foreground [&:not(:last-child)]:mb-2"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }: React.ComponentProps<'table'>) => (
    <div className="overflow-x-auto [&:not(:last-child)]:mb-2">
      <table className="w-full text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: React.ComponentProps<'th'>) => (
    <th
      className="border border-border bg-muted px-2 py-1 text-left text-xs font-medium"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.ComponentProps<'td'>) => (
    <td className="border border-border px-2 py-1 text-sm" {...props}>
      {children}
    </td>
  ),
  strong: ({ children, ...props }: React.ComponentProps<'strong'>) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
  h1: ({ children, ...props }: React.ComponentProps<'h1'>) => (
    <h1 className="mb-2 text-base font-semibold" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: React.ComponentProps<'h2'>) => (
    <h2 className="mb-1.5 text-sm font-semibold" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.ComponentProps<'h3'>) => (
    <h3 className="mb-1 text-sm font-semibold" {...props}>
      {children}
    </h3>
  ),
} as const;

// ─── 操作按钮 ──────────────────────────────────────────────

function MessageActions({
  content,
  isAssistant,
  isStreaming,
  messageId,
  onCopy,
  onRegenerate,
}: {
  content: string;
  isAssistant: boolean;
  isStreaming: boolean;
  messageId: string;
  onCopy?: (content: string) => void;
  onRegenerate?: (messageId: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    onCopy?.(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content, onCopy]);

  const handleRegenerate = useCallback(() => {
    onRegenerate?.(messageId);
  }, [messageId, onRegenerate]);

  if (isStreaming) return null;

  return (
    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCopy}
              className="size-6 text-muted-foreground hover:text-foreground"
              aria-label="复制消息"
            >
              {copied ? (
                <Check className="size-3" />
              ) : (
                <Copy className="size-3" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span className="text-xs">{copied ? '已复制' : '复制'}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isAssistant && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleRegenerate}
                className="size-6 text-muted-foreground hover:text-foreground"
                aria-label="重新生成"
              >
                <RefreshCw className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span className="text-xs">重新生成</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

// ─── 来源引用 ──────────────────────────────────────────────

function SourceCitations({
  sources,
}: {
  sources: readonly { textbook: string; chapter: string; snippet: string; relevance: number }[];
}) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <BookOpen className="size-3" />
        <span className="font-medium">来源引用</span>
      </div>
      <div className="space-y-1">
        {sources.map((source, idx) => (
          <div
            key={`${source.textbook}-${idx}`}
            className="rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs"
          >
            <span className="font-medium text-foreground">{source.textbook}</span>
            {source.chapter && (
              <span className="text-muted-foreground"> · {source.chapter}</span>
            )}
            <p className="mt-0.5 line-clamp-2 leading-relaxed text-muted-foreground">
              {source.snippet}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 打字指示器 ────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
      <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
      <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
    </div>
  );
}

// ─── ChatMessage ───────────────────────────────────────────

function ChatMessage({
  message,
  onCopy,
  onRegenerate,
  className,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const hasContent = message.content.length > 0;

  return (
    <div
      className={cn(
        'group flex w-full gap-2 animate-fade-in-up',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className,
      )}
      data-slot="chat-message"
    >
      <div
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary text-primary-foreground'
            : isAssistant
              ? 'bg-muted text-muted-foreground'
              : 'bg-secondary text-secondary-foreground',
        )}
      >
        {isUser ? (
          <User className="size-3.5" />
        ) : isAssistant ? (
          <Bot className="size-3.5" />
        ) : (
          <Bot className="size-3.5" />
        )}
      </div>

      <div
        className={cn(
          'flex min-w-0 max-w-[85%] flex-col',
          isUser ? 'items-end' : 'items-start',
        )}
      >
        <span className="mb-1 text-xs text-muted-foreground">
          {isUser ? '你' : isAssistant ? 'AI 助手' : '系统'}
        </span>

        <div
          className={cn(
            'relative rounded-xl px-3.5 py-2.5 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-card-foreground shadow-xs',
          )}
        >
          {!hasContent && message.isStreaming ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </p>
          ) : (
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </Markdown>
          )}
        </div>

        {isAssistant && message.sources && message.sources.length > 0 && (
          <SourceCitations sources={message.sources} />
        )}

        <div className="mt-1 flex items-center gap-2">
          <MessageActions
            content={message.content}
            isAssistant={isAssistant}
            isStreaming={message.isStreaming}
            messageId={message.id}
            onCopy={onCopy}
            onRegenerate={onRegenerate}
          />
          <span className="text-[10px] text-muted-foreground/60">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── 时间格式化 ────────────────────────────────────────────

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export { ChatMessage };
export type { ChatMessageProps };

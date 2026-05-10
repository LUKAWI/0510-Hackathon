import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import {
  Send,
  Paperclip,
  CircleStop,
  CornerDownLeft,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ChatIntent } from '@/types';

const MAX_ROWS = 8;
const LINE_HEIGHT = 24;
const MIN_HEIGHT = LINE_HEIGHT + 16;

interface IntentOption {
  readonly value: ChatIntent;
  readonly label: string;
  readonly description: string;
}

const INTENT_OPTIONS: readonly IntentOption[] = [
  { value: 'query', label: '提问', description: '提出新的问题' },
  { value: 'modify_decision', label: '修改决策', description: '修改之前的整合决策' },
  { value: 'undo', label: '撤销', description: '撤销上一步操作' },
  { value: 'confirm', label: '确认', description: '确认当前决策' },
  { value: 'explore', label: '探索', description: '深入探索某个概念' },
] as const;

interface ChatInputProps {
  onSend: (message: string, intent: ChatIntent) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
  className?: string;
}

function ChatInput({
  onSend,
  onStop,
  disabled = false,
  isStreaming = false,
  placeholder = '输入消息…',
  className,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');
  const [selectedIntent, setSelectedIntent] = useState<ChatIntent>('query');
  const [showIntentPicker, setShowIntentPicker] = useState(false);

  const canSend = value.trim().length > 0 && !disabled;

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const maxHeight = MAX_ROWS * LINE_HEIGHT + 16;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed.length === 0 || disabled) return;

    onSend(trimmed, selectedIntent);
    setValue('');

    requestAnimationFrame(() => {
      adjustHeight();
      textareaRef.current?.focus();
    });
  }, [value, disabled, selectedIntent, onSend, adjustHeight]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (isStreaming) {
          onStop?.();
        } else {
          handleSend();
        }
      }
    },
    [handleSend, isStreaming, onStop],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
    },
    [],
  );

  const handleIntentSelect = useCallback((intent: ChatIntent) => {
    setSelectedIntent(intent);
    setShowIntentPicker(false);
    textareaRef.current?.focus();
  }, []);

  const currentIntent = INTENT_OPTIONS.find((o) => o.value === selectedIntent);

  return (
    <div className={cn('border-t border-border bg-background px-4 py-3', className)}>
      <div className="relative rounded-xl border border-border bg-card shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled && !isStreaming}
          placeholder={placeholder}
          rows={1}
          className={cn(
            'w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm',
            'outline-none placeholder:text-muted-foreground',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          style={{ minHeight: `${MIN_HEIGHT}px` }}
          aria-label="聊天输入框"
        />

        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon-xs"
              className="size-7 text-muted-foreground hover:text-foreground"
              disabled={disabled}
              aria-label="附加文件"
            >
              <Paperclip className="size-3.5" />
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowIntentPicker((prev) => !prev)}
                disabled={disabled}
                className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                aria-label="选择意图"
                aria-expanded={showIntentPicker}
              >
                {currentIntent?.label ?? '提问'}
                <X className={cn(
                  'size-3 transition-transform',
                  showIntentPicker && 'rotate-90',
                )} />
              </Button>

              {showIntentPicker && (
                <div className="absolute bottom-full left-0 mb-1 w-48 rounded-lg border border-border bg-popover p-1 shadow-md">
                  {INTENT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleIntentSelect(option.value)}
                      className={cn(
                        'flex w-full flex-col gap-0.5 rounded-md px-2.5 py-1.5 text-left transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        option.value === selectedIntent && 'bg-accent text-accent-foreground',
                      )}
                    >
                      <span className="text-xs font-medium">{option.label}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isStreaming ? (
              <Button
                variant="destructive"
                size="xs"
                onClick={onStop}
                className="gap-1.5"
                aria-label="停止生成"
              >
                <CircleStop className="size-3.5" />
                <span className="text-xs">停止</span>
              </Button>
            ) : (
              <Button
                variant={canSend ? 'default' : 'secondary'}
                size="xs"
                onClick={handleSend}
                disabled={!canSend}
                className="gap-1.5"
                aria-label="发送消息"
              >
                <Send className="size-3.5" />
                <span className="text-xs">发送</span>
                <kbd className="ml-1 hidden items-center gap-0.5 rounded bg-primary-foreground/20 px-1 py-0.5 text-[10px] font-medium sm:inline-flex">
                  <CornerDownLeft className="size-2.5" />
                </kbd>
              </Button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60">
        AI 基于已上传的教材内容回答，仅供参考学习
      </p>
    </div>
  );
}

export { ChatInput };
export type { ChatInputProps };

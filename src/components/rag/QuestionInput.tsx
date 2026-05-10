import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuestionInputProps {
  /** Called when the user submits a question */
  readonly onSubmit: (question: string) => void;
  /** Whether a RAG query is in progress */
  readonly isLoading?: boolean;
  /** Placeholder text for the input */
  readonly placeholder?: string;
  /** Whether the input is disabled */
  readonly disabled?: boolean;
  readonly className?: string;
}

const MAX_ROWS = 6;
const LINE_HEIGHT_PX = 24;
const MAX_HEIGHT_PX = MAX_ROWS * LINE_HEIGHT_PX;

function QuestionInput({
  onSubmit,
  isLoading = false,
  placeholder = "输入问题，基于已索引教材进行检索问答…",
  disabled = false,
  className,
}: QuestionInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = `${Math.min(scrollHeight, MAX_HEIGHT_PX)}px`;
    textarea.style.overflowY = scrollHeight > MAX_HEIGHT_PX ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const canSubmit = value.trim().length > 0 && !isLoading && !disabled;

  function handleSubmit() {
    if (!canSubmit) return;

    const question = value.trim();
    onSubmit(question);
    setValue("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
    }
  }

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && e.shiftKey) {
      return;
    }

    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div
      className={cn(
        "flex items-end gap-2 rounded-xl border border-border bg-card p-3 shadow-sm transition-colors",
        "focus-within:border-ring focus-within:ring-[1px] focus-within:ring-ring/30",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        rows={1}
        className={cn(
          "min-h-6 flex-1 resize-none bg-transparent text-sm leading-6 text-foreground",
          "placeholder:text-muted-foreground",
          "outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        aria-label="输入问题"
      />

      <Button
        size="icon-sm"
        disabled={!canSubmit}
        onClick={handleSubmit}
        aria-label="发送问题"
        className="shrink-0"
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
      </Button>
    </div>
  );
}

export { QuestionInput };
export type { QuestionInputProps };

import { useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { Citation } from "@/types";

interface AnswerDisplayProps {
  readonly answer: string;
  readonly sources: readonly Citation[];
  readonly onCitationClick?: (index: number) => void;
  readonly className?: string;
}

const CITATION_PREFIX = "§CITE_";
const CITATION_SUFFIX = "§";

function encodeCitations(text: string, sourcesLength: number): string {
  return text.replace(/\[(\d+)\]/g, (_, num: string) => {
    const refNum = parseInt(num, 10);
    if (refNum >= 1 && refNum <= sourcesLength) {
      return `${CITATION_PREFIX}${refNum}${CITATION_SUFFIX}`;
    }
    return `[${num}]`;
  });
}

function AnswerDisplay({
  answer,
  sources,
  onCitationClick,
  className,
}: AnswerDisplayProps) {
  const processedAnswer = encodeCitations(answer, sources.length);

  const handleCitationClick = useCallback(
    (index: number) => (e: React.MouseEvent) => {
      e.stopPropagation();
      onCitationClick?.(index);
    },
    [onCitationClick],
  );

  function renderTextWithCitations(text: string): React.ReactNode[] {
    const regex = /§CITE_(\d+)§/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const refNum = parseInt(match[1] ?? '0', 10);
      parts.push(
        <button
          key={`cite-${refNum}-${match.index}`}
          type="button"
          onClick={handleCitationClick(refNum - 1)}
          className={cn(
            "inline-flex items-center justify-center",
            "mx-0.5 size-5 rounded-full bg-primary/10 text-[10px] font-semibold text-primary",
            "transition-colors hover:bg-primary/20",
            "cursor-pointer align-baseline leading-none",
          )}
          aria-label={`查看引用 ${refNum}`}
          title={`引用 ${refNum}: ${sources[refNum - 1]?.textbook ?? ""}`}
        >
          {refNum}
        </button>,
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  }

  function processChildren(children: React.ReactNode): React.ReactNode {
    if (typeof children === "string") {
      const parts = renderTextWithCitations(children);
      return parts.length === 1 ? parts[0] : <>{parts}</>;
    }
    if (Array.isArray(children)) {
      return children.map((child, i) => {
        if (typeof child === "string") {
          const parts = renderTextWithCitations(child);
          return <span key={i}>{parts.length === 1 ? parts[0] : parts}</span>;
        }
        return child;
      });
    }
    return children;
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div
        className={cn(
          "prose prose-sm prose-neutral max-w-none dark:prose-invert",
          "prose-headings:font-semibold prose-headings:text-foreground",
          "prose-p:leading-relaxed prose-p:text-foreground",
          "prose-strong:text-foreground prose-strong:font-semibold",
          "prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono",
          "prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg",
          "prose-ol:list-decimal prose-ol:pl-5",
          "prose-ul:list-disc prose-ul:pl-5",
          "prose-li:text-foreground prose-li:leading-relaxed",
          "prose-blockquote:border-l-border prose-blockquote:text-muted-foreground",
          "prose-a:text-primary prose-a:underline-offset-4",
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children, ...props }) => (
              <p {...props}>{processChildren(children)}</p>
            ),
          }}
        >
          {processedAnswer}
        </ReactMarkdown>
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          以上内容整合自教材原文，仅供参考学习，如有疑问请查阅原书
        </p>
      </div>
    </div>
  );
}

export { AnswerDisplay };
export type { AnswerDisplayProps };

import { useState, useCallback } from 'react';
import {
  GitMerge,
  MessageCircleQuestion,
  MessagesSquare,
  ScrollText,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLayoutStore, type RightPanelTab } from '@/stores/layout';
import { cn } from '@/lib/utils';
import { ReportPanel } from '@/components/report/ReportPanel';
import { MergePanel } from '@/components/merge/MergePanel';
import { QuestionInput, AnswerDisplay } from '@/components/rag';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatHistory } from '@/components/chat/ChatHistory';
import { ragApi, chatApi } from '@/lib/api';
import type { Citation, ChatMessage, ChatIntent } from '@/types';

// ─── Tab 配置 ──────────────────────────────────────────────

interface TabConfig {
  value: RightPanelTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TAB_CONFIGS: TabConfig[] = [
  { value: 'merge', label: '整合操作', icon: GitMerge },
  { value: 'rag', label: 'RAG 问答', icon: MessageCircleQuestion },
  { value: 'chat', label: '多轮对话', icon: MessagesSquare },
  { value: 'report', label: '整合报告', icon: ScrollText },
];

// ─── RAG 问答面板 ──────────────────────────────────────────

function RAGPanel() {
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<readonly Citation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (question: string) => {
    setIsLoading(true);
    setError(null);
    setAnswer('');
    setSources([]);

    try {
      const response = await ragApi.queryRAG({ question, top_k: 5 });
      setAnswer(response.answer);
      setSources(response.citations);
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <QuestionInput onSubmit={handleSubmit} isLoading={isLoading} />

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {answer && (
        <AnswerDisplay answer={answer} sources={sources} />
      )}
    </div>
  );
}

// ─── 多轮对话面板 ──────────────────────────────────────────

function ChatPanel() {
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = useCallback(async (content: string, _intent: ChatIntent) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      sources: null,
      intent: null,
      isStreaming: false,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setError(null);

    try {
      const response = await chatApi.sendMessage({
        session_id: sessionId,
        message: content,
      });

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString(),
        sources: response.citations,
        intent: null,
        isStreaming: false,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败，请重试');
    } finally {
      setIsStreaming(false);
    }
  }, [sessionId]);

  return (
    <div className="flex h-full flex-col">
      <ChatHistory messages={messages} isStreaming={isStreaming} />

      {error && (
        <div className="mx-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <ChatInput
        onSend={handleSend}
        isStreaming={isStreaming}
      />
    </div>
  );
}

// ─── PanelTabs ─────────────────────────────────────────────

export function PanelTabs() {
  const activeTab = useLayoutStore((s) => s.rightPanelTab);
  const setActiveTab = useLayoutStore((s) => s.setRightPanelTab);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as RightPanelTab)}
      className="flex h-full flex-col"
    >
      <TabsList variant="line" className="w-full justify-start rounded-none border-b border-border px-2">
        {TAB_CONFIGS.map(({ value, label, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            className={cn(
              'gap-1.5 rounded-none px-3 py-2 text-xs tracking-wide',
              'data-[state=active]:border-b-2 data-[state=active]:border-foreground',
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="merge" className="flex-1 overflow-hidden">
        <MergePanel />
      </TabsContent>

      <TabsContent value="rag" className="flex-1 overflow-hidden">
        <RAGPanel />
      </TabsContent>

      <TabsContent value="chat" className="flex-1 overflow-hidden">
        <ChatPanel />
      </TabsContent>

      <TabsContent value="report" className="flex-1 overflow-hidden">
        <ReportPanel />
      </TabsContent>
    </Tabs>
  );
}

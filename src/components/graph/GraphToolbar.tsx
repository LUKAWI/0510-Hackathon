import { Search, ZoomIn, ZoomOut, Maximize, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGraphStore } from "@/stores/graph";
import { cn } from "@/lib/utils";

interface GraphToolbarProps {
  className?: string;
}

function emitGraphEvent(eventName: string) {
  window.dispatchEvent(new CustomEvent(eventName));
}

function GraphToolbar({ className }: GraphToolbarProps) {
  const searchKeyword = useGraphStore((s) => s.searchKeyword);
  const setSearchKeyword = useGraphStore((s) => s.setSearchKeyword);

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex items-center gap-1 rounded-lg border bg-card p-1 shadow-sm",
          className,
        )}
        data-slot="graph-toolbar"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索节点…"
            className="h-8 w-40 pl-8 text-xs"
          />
        </div>

        <div className="mx-1 h-5 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => emitGraphEvent("graph:zoom-in")}
            >
              <ZoomIn />
            </Button>
          </TooltipTrigger>
          <TooltipContent>放大</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => emitGraphEvent("graph:zoom-out")}
            >
              <ZoomOut />
            </Button>
          </TooltipTrigger>
          <TooltipContent>缩小</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => emitGraphEvent("graph:zoom-fit")}
            >
              <Maximize />
            </Button>
          </TooltipTrigger>
          <TooltipContent>适应画布</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => emitGraphEvent("graph:zoom-reset")}
            >
              <RotateCcw />
            </Button>
          </TooltipTrigger>
          <TooltipContent>重置缩放</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export { GraphToolbar };
export type { GraphToolbarProps };

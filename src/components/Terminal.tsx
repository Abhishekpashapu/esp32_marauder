import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { useSerial } from "@/context/SerialContext";
import { Button } from "@/components/ui/button";
import { Trash2, Pause, Play, Copy, ChevronRight, TerminalSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LogLevel } from "@/lib/parser";

const LEVEL_CLASS: Record<LogLevel, string> = {
  info: "text-terminal-fg",
  ok: "text-primary text-glow-primary",
  warn: "text-terminal-warn",
  error: "text-terminal-error",
  debug: "text-terminal-info",
};

const LEVEL_PREFIX: Record<LogLevel, string> = {
  info: "·",
  ok: "✓",
  warn: "!",
  error: "✗",
  debug: "»",
};

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toTimeString().slice(0, 8);
}

interface TerminalProps {
  className?: string;
  height?: string;
}

export function Terminal({ className, height = "h-[420px]" }: TerminalProps) {
  const { lines, send, paused, setPaused, clearTerminal, copyTerminal, status, history } = useSerial();
  const [input, setInput] = useState("");
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoScroll || paused) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, autoScroll, paused]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 16;
    setAutoScroll(atBottom);
  };

  const handleKey = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = input;
      setInput("");
      setHistoryIdx(-1);
      await send(cmd);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const next = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(next);
      setInput(history[next] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(historyIdx - 1, -1);
      setHistoryIdx(next);
      setInput(next === -1 ? "" : history[next] ?? "");
    } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      clearTerminal();
    }
  };

  const handleCopy = async () => {
    await copyTerminal();
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-terminal-bg shadow-elevated",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-card/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <TerminalSquare className="h-4 w-4 text-primary" />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            ESP32 · /dev/serial · 115200 8N1
          </span>
          {paused && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-warning border border-warning/40 bg-warning/10 rounded px-1.5 py-0.5">
              Paused
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setPaused(!paused)} title={paused ? "Resume" : "Pause"}>
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCopy} title="Copy logs">
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">{copied ? "Copied" : "Copy"}</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={clearTerminal} title="Clear">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Output */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className={cn("scanline relative overflow-y-auto px-3 py-2 font-mono text-[12.5px] leading-5", height)}
      >
        {lines.length === 0 ? (
          <div className="text-terminal-muted italic">
            {status === "connected"
              ? "Awaiting data from device..."
              : "No serial connection. Click 'Connect ESP32' to begin."}
          </div>
        ) : (
          lines.map((l) => (
            <div key={l.id} className={cn("flex gap-2 whitespace-pre-wrap break-words", LEVEL_CLASS[l.level])}>
              <span className="text-terminal-muted shrink-0 select-none">{formatTime(l.ts)}</span>
              <span className="text-terminal-muted shrink-0 select-none w-3">{LEVEL_PREFIX[l.level]}</span>
              <span>{l.text}</span>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-border/60 bg-card/40 px-3 py-2">
        <ChevronRight className="h-4 w-4 text-primary" />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={status !== "connected"}
          placeholder={status === "connected" ? "Type a command and press Enter..." : "Connect device to send commands"}
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent font-mono text-sm text-terminal-fg placeholder:text-terminal-muted outline-none disabled:opacity-50 caret-primary"
        />
        <span className="h-4 w-1.5 bg-primary animate-blink" aria-hidden />
        {!autoScroll && (
          <button
            onClick={() => {
              setAutoScroll(true);
              const el = scrollRef.current;
              if (el) el.scrollTop = el.scrollHeight;
            }}
            className="text-[10px] uppercase tracking-widest text-secondary border border-secondary/40 bg-secondary/10 rounded px-1.5 py-0.5 hover:bg-secondary/20"
          >
            Jump to latest
          </button>
        )}
      </div>
    </div>
  );
}

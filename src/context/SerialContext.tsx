import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  connectSerial as libConnect,
  disconnectSerial as libDisconnect,
  sendCommand as libSend,
  setChunkHandler,
  setStatusHandler,
  isWebSerialSupported,
  getPortInfo,
  type SerialStatus,
} from "@/lib/serial";
import { parseChunk, resetParser, type TerminalLine, type WifiNetwork } from "@/lib/parser";

interface SerialContextValue {
  supported: boolean;
  status: SerialStatus;
  error: string | null;
  portInfo: string | null;
  lines: TerminalLine[];
  wifi: WifiNetwork[];
  lastWifiUpdate: number | null;
  lastCommand: string | null;
  history: string[];
  paused: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  send: (cmd: string) => Promise<void>;
  clearTerminal: () => void;
  setPaused: (p: boolean) => void;
  copyTerminal: () => Promise<void>;
}

const SerialContext = createContext<SerialContextValue | null>(null);

const MAX_LINES = 2000;

export function SerialProvider({ children }: { children: React.ReactNode }) {
  const [supported] = useState<boolean>(() => isWebSerialSupported());
  const [status, setStatus] = useState<SerialStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [portInfo, setPortInfo] = useState<string | null>(null);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [wifi, setWifi] = useState<WifiNetwork[]>([]);
  const [lastWifiUpdate, setLastWifiUpdate] = useState<number | null>(null);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);

  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Buffer incoming lines and flush on rAF to avoid UI freezes at high data rates.
  const pendingLines = useRef<TerminalLine[]>([]);
  const pendingWifi = useRef<WifiNetwork[] | null>(null);
  const flushScheduled = useRef(false);

  const scheduleFlush = useCallback(() => {
    if (flushScheduled.current) return;
    flushScheduled.current = true;
    requestAnimationFrame(() => {
      flushScheduled.current = false;
      if (pendingLines.current.length) {
        const incoming = pendingLines.current;
        pendingLines.current = [];
        setLines((prev) => {
          const next = prev.concat(incoming);
          return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
        });
      }
      if (pendingWifi.current) {
        const w = pendingWifi.current;
        pendingWifi.current = null;
        setWifi(w);
        setLastWifiUpdate(Date.now());
      }
    });
  }, []);

  useEffect(() => {
    setChunkHandler((text) => {
      const event = parseChunk(text);
      if (event.lines.length && !pausedRef.current) {
        pendingLines.current.push(...event.lines);
      }
      if (event.wifi && event.wifi.length) {
        pendingWifi.current = event.wifi;
      }
      scheduleFlush();
    });
    setStatusHandler((s, err) => {
      setStatus(s);
      if (s === "connected") {
        setError(null);
        setPortInfo(getPortInfo());
      } else if (s === "disconnected") {
        setPortInfo(null);
      } else if (s === "error") {
        setError(err ?? "Serial error");
      }
    });
    return () => {
      setChunkHandler(null);
      setStatusHandler(null);
    };
  }, [scheduleFlush]);

  const connect = useCallback(async () => {
    setError(null);
    try {
      await libConnect(115200);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const disconnect = useCallback(async () => {
    await libDisconnect();
    resetParser();
  }, []);

  const send = useCallback(async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    try {
      await libSend(trimmed);
      setLastCommand(trimmed);
      setHistory((h) => [trimmed, ...h.filter((x) => x !== trimmed)].slice(0, 50));
      // echo into terminal
      pendingLines.current.push({
        id: `echo-${Date.now()}-${Math.random()}`,
        ts: Date.now(),
        level: "debug",
        text: `> ${trimmed}`,
      });
      scheduleFlush();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [scheduleFlush]);

  const clearTerminal = useCallback(() => {
    setLines([]);
    pendingLines.current = [];
  }, []);

  const copyTerminal = useCallback(async () => {
    const text = lines.map((l) => l.text).join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
  }, [lines]);

  const value = useMemo<SerialContextValue>(
    () => ({
      supported,
      status,
      error,
      portInfo,
      lines,
      wifi,
      lastWifiUpdate,
      lastCommand,
      history,
      paused,
      connect,
      disconnect,
      send,
      clearTerminal,
      setPaused,
      copyTerminal,
    }),
    [supported, status, error, portInfo, lines, wifi, lastWifiUpdate, lastCommand, history, paused, connect, disconnect, send, clearTerminal, copyTerminal]
  );

  return <SerialContext.Provider value={value}>{children}</SerialContext.Provider>;
}

export function useSerial() {
  const ctx = useContext(SerialContext);
  if (!ctx) throw new Error("useSerial must be used inside <SerialProvider>");
  return ctx;
}

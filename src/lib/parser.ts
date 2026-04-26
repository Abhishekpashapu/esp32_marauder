// Parser: classifies raw serial text into structured events.
// Buffers partial lines and emits complete logical lines.

export type LogLevel = "info" | "ok" | "warn" | "error" | "debug";

export interface TerminalLine {
  id: string;
  ts: number;
  level: LogLevel;
  text: string;
}

export interface WifiNetwork {
  ssid: string;
  rssi: number;
  channel: number;
  encryption: string;
}

export interface ParsedEvent {
  lines: TerminalLine[];
  wifi?: WifiNetwork[];
  status?: Record<string, string | number>;
}

let lineBuffer = "";
let scanningWifi = false;
let scanBatch: WifiNetwork[] = [];

let counter = 0;
const nextId = () => `${Date.now()}-${counter++}`;

function classify(line: string): LogLevel {
  const lower = line.toLowerCase();
  if (/\b(error|err|fail|failed|panic|exception|fatal)\b/.test(lower)) return "error";
  if (/\b(warn|warning)\b/.test(lower)) return "warn";
  if (/\b(ok|ready|success|connected)\b/.test(lower)) return "ok";
  if (/\b(debug|dbg)\b/.test(lower)) return "debug";
  return "info";
}

const ENCRYPTIONS = ["OPEN", "WEP", "WPA", "WPA2", "WPA3", "WPA/WPA2", "WPA2/WPA3", "WPA2-EAP"];

function tryParseWifi(line: string): WifiNetwork | null {
  // Common patterns:
  // 1) " 1: SSID (-67) Ch:6 [WPA2]"
  // 2) "SSID: MyNet, RSSI: -67, CH: 6, ENC: WPA2"
  // 3) "MyNet  -67  6  WPA2"   (table row)
  let m = line.match(/^\s*\d+[:\)]\s*(.+?)\s*\((-?\d{1,3})\)\s*(?:Ch[: ])\s*(\d{1,2})\s*\[(.+?)\]/i);
  if (m) return { ssid: m[1].trim(), rssi: parseInt(m[2], 10), channel: parseInt(m[3], 10), encryption: m[4].trim() };

  m = line.match(/SSID\s*[:=]\s*([^,;]+)[,;].*RSSI\s*[:=]\s*(-?\d{1,3}).*(?:CH|Channel)\s*[:=]\s*(\d{1,2})(?:.*ENC(?:RYPTION)?\s*[:=]\s*([\w\/-]+))?/i);
  if (m) return { ssid: m[1].trim(), rssi: parseInt(m[2], 10), channel: parseInt(m[3], 10), encryption: (m[4] || "OPEN").trim() };

  // Plain whitespace columns
  m = line.match(/^\s*([^\s].{0,31}?)\s{2,}(-?\d{2,3})\s+(\d{1,2})\s+([A-Z0-9\/\-]+)\s*$/);
  if (m && ENCRYPTIONS.some((e) => m![4].toUpperCase().includes(e))) {
    return { ssid: m[1].trim(), rssi: parseInt(m[2], 10), channel: parseInt(m[3], 10), encryption: m[4].trim() };
  }
  return null;
}

function detectScanBoundary(line: string): "start" | "end" | null {
  const lower = line.toLowerCase();
  if (/scan(ning)?\s*(start|begin|wifi)/.test(lower) || /^\s*wifi\s+scan/i.test(line)) return "start";
  if (/scan\s*(complete|done|finished)/.test(lower) || /(\d+)\s+networks?\s+found/.test(lower)) return "end";
  return null;
}

export function parseChunk(chunk: string): ParsedEvent {
  const event: ParsedEvent = { lines: [] };
  lineBuffer += chunk;

  // Normalize line endings
  const parts = lineBuffer.split(/\r\n|\r|\n/);
  lineBuffer = parts.pop() ?? "";

  for (const raw of parts) {
    const line = raw.replace(/\u0000/g, "");
    if (line.length === 0) continue;

    // Wifi parsing
    const boundary = detectScanBoundary(line);
    if (boundary === "start") {
      scanningWifi = true;
      scanBatch = [];
    }

    const wifi = tryParseWifi(line);
    if (wifi) {
      scanBatch.push(wifi);
      scanningWifi = true;
    }

    if (boundary === "end") {
      if (scanBatch.length > 0) {
        event.wifi = [...scanBatch];
      }
      scanningWifi = false;
      scanBatch = [];
    }

    event.lines.push({
      id: nextId(),
      ts: Date.now(),
      level: classify(line),
      text: line,
    });
  }

  // If a scan batch grew but we never see an explicit "done", flush after a quiet period.
  // Caller can flush via flushPendingWifi().
  return event;
}

export function flushPendingWifi(): WifiNetwork[] | null {
  if (scanBatch.length > 0) {
    const out = [...scanBatch];
    scanBatch = [];
    scanningWifi = false;
    return out;
  }
  return null;
}

export function resetParser() {
  lineBuffer = "";
  scanBatch = [];
  scanningWifi = false;
}

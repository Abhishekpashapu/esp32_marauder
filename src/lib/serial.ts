/// <reference path="../types/web-serial.d.ts" />
// Web Serial API manager for ESP32
// Maintains port, reader, writer; provides connect/disconnect/send/readLoop

export type SerialChunkHandler = (text: string) => void;
export type SerialStatusHandler = (status: SerialStatus, error?: string) => void;

export type SerialStatus = "disconnected" | "connecting" | "connected" | "error";

interface SerialState {
  port: SerialPort | null;
  reader: ReadableStreamDefaultReader<Uint8Array> | null;
  writer: WritableStreamDefaultWriter<Uint8Array> | null;
  keepReading: boolean;
}

const state: SerialState = {
  port: null,
  reader: null,
  writer: null,
  keepReading: false,
};

let chunkHandler: SerialChunkHandler | null = null;
let statusHandler: SerialStatusHandler | null = null;

export function isWebSerialSupported(): boolean {
  return typeof navigator !== "undefined" && "serial" in navigator;
}

export function setChunkHandler(fn: SerialChunkHandler | null) {
  chunkHandler = fn;
}

export function setStatusHandler(fn: SerialStatusHandler | null) {
  statusHandler = fn;
}

function emitStatus(s: SerialStatus, err?: string) {
  statusHandler?.(s, err);
}

export async function connectSerial(baudRate = 115200): Promise<void> {
  if (!isWebSerialSupported()) {
    throw new Error("Web Serial API not supported. Use Chrome or Edge.");
  }
  emitStatus("connecting");
  try {
    const port = await (navigator as Navigator & { serial: Serial }).serial.requestPort();
    await port.open({ baudRate });
    state.port = port;

    if (port.writable) {
      state.writer = port.writable.getWriter();
    }
    state.keepReading = true;
    emitStatus("connected");
    readLoop().catch((e) => emitStatus("error", String(e)));
  } catch (e) {
    emitStatus("error", e instanceof Error ? e.message : String(e));
    throw e;
  }
}

export async function disconnectSerial(): Promise<void> {
  state.keepReading = false;
  try {
    if (state.reader) {
      try {
        await state.reader.cancel();
      } catch {
        /* ignore */
      }
      try {
        state.reader.releaseLock();
      } catch {
        /* ignore */
      }
      state.reader = null;
    }
    if (state.writer) {
      try {
        await state.writer.close();
      } catch {
        /* ignore */
      }
      try {
        state.writer.releaseLock();
      } catch {
        /* ignore */
      }
      state.writer = null;
    }
    if (state.port) {
      try {
        await state.port.close();
      } catch {
        /* ignore */
      }
      state.port = null;
    }
  } finally {
    emitStatus("disconnected");
  }
}

export async function sendCommand(cmd: string, appendNewline = true): Promise<void> {
  if (!state.writer) throw new Error("Serial not connected");
  const payload = appendNewline && !cmd.endsWith("\n") ? cmd + "\n" : cmd;
  const data = new TextEncoder().encode(payload);
  await state.writer.write(data);
}

export async function readLoop(): Promise<void> {
  if (!state.port || !state.port.readable) return;
  const decoder = new TextDecoder();

  while (state.keepReading && state.port?.readable) {
    try {
      state.reader = state.port.readable.getReader();
      try {
        while (state.keepReading) {
          const { value, done } = await state.reader.read();
          if (done) break;
          if (value && value.length) {
            const text = decoder.decode(value, { stream: true });
            if (text && chunkHandler) chunkHandler(text);
          }
        }
      } finally {
        try {
          state.reader.releaseLock();
        } catch {
          /* ignore */
        }
        state.reader = null;
      }
    } catch (e) {
      emitStatus("error", e instanceof Error ? e.message : String(e));
      break;
    }
  }
}

export function getPortInfo(): string | null {
  if (!state.port) return null;
  try {
    const info = state.port.getInfo();
    if (info.usbVendorId && info.usbProductId) {
      return `USB ${info.usbVendorId.toString(16).padStart(4, "0")}:${info.usbProductId
        .toString(16)
        .padStart(4, "0")}`;
    }
  } catch {
    /* ignore */
  }
  return "Serial Port";
}

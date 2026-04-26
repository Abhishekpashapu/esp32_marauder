import { useSerial } from "@/context/SerialContext";
import { Button } from "@/components/ui/button";
import { Plug, PlugZap, Loader2, AlertTriangle, Usb } from "lucide-react";
import { cn } from "@/lib/utils";

export function SerialConnect({ compact = false }: { compact?: boolean }) {
  const { supported, status, error, portInfo, connect, disconnect } = useSerial();

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  if (!supported) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <span>Web Serial unsupported. Use Chrome or Edge.</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", compact && "gap-2")}>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-1.5 backdrop-blur">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full transition-all",
            isConnected && "bg-primary shadow-glow-primary animate-pulse-glow",
            isConnecting && "bg-warning animate-pulse",
            status === "disconnected" && "bg-muted-foreground/40",
            status === "error" && "bg-destructive"
          )}
        />
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {isConnected ? `Connected${portInfo ? ` · ${portInfo}` : ""}` : status}
        </span>
      </div>

      {isConnected ? (
        <Button onClick={disconnect} variant="outline" size={compact ? "sm" : "default"}>
          <Plug className="h-4 w-4" />
          Disconnect
        </Button>
      ) : (
        <Button
          onClick={connect}
          disabled={isConnecting}
          variant="hero"
          size={compact ? "sm" : "default"}
        >
          {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
          {isConnecting ? "Connecting..." : "Connect ESP32"}
        </Button>
      )}

      {error && !isConnected && (
        <div className="hidden md:flex items-center gap-2 text-xs text-destructive font-mono max-w-xs truncate">
          <Usb className="h-3.5 w-3.5" />
          {error}
        </div>
      )}
    </div>
  );
}

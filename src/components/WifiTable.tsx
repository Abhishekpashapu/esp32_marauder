import { useMemo, useState } from "react";
import { useSerial } from "@/context/SerialContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, RefreshCw, Wifi, WifiOff, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WifiNetwork } from "@/lib/parser";

type SortKey = "ssid" | "rssi" | "channel" | "encryption";

function rssiBars(rssi: number) {
  // typical: -30 great, -90 awful
  if (rssi >= -55) return 4;
  if (rssi >= -67) return 3;
  if (rssi >= -75) return 2;
  if (rssi >= -85) return 1;
  return 0;
}

function rssiColor(rssi: number) {
  if (rssi >= -60) return "text-primary";
  if (rssi >= -75) return "text-secondary";
  if (rssi >= -85) return "text-warning";
  return "text-destructive";
}

export function WifiTable({ scanCommand = "scan" }: { scanCommand?: string }) {
  const { wifi, lastWifiUpdate, send, status } = useSerial();
  const [sortKey, setSortKey] = useState<SortKey>("rssi");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filter, setFilter] = useState("");

  const rows = useMemo(() => {
    const filtered = wifi.filter((n) =>
      [n.ssid, n.encryption].some((s) => s.toLowerCase().includes(filter.toLowerCase()))
    );
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [wifi, sortKey, sortDir, filter]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "rssi" ? "desc" : "asc");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur shadow-elevated overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-primary" />
          <h3 className="font-mono text-sm uppercase tracking-wider">WiFi Networks</h3>
          <span className="text-xs text-muted-foreground font-mono">
            {wifi.length} found{lastWifiUpdate ? ` · ${new Date(lastWifiUpdate).toLocaleTimeString()}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter SSID / enc"
              className="h-8 w-44 pl-7 font-mono text-xs"
            />
          </div>
          <Button
            size="sm"
            variant="neon"
            onClick={() => send(scanCommand)}
            disabled={status !== "connected"}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Scan
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground font-mono">
            <tr>
              {(["ssid", "rssi", "channel", "encryption"] as SortKey[]).map((k) => (
                <th key={k} className="px-4 py-2 text-left">
                  <button
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => toggleSort(k)}
                  >
                    {k}
                    <ArrowUpDown className={cn("h-3 w-3 opacity-40", sortKey === k && "opacity-100 text-primary")} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <WifiOff className="h-6 w-6" />
                    <span className="font-mono text-xs">
                      {status === "connected"
                        ? `No networks parsed yet. Send '${scanCommand}'.`
                        : "Connect device to scan networks."}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((n: WifiNetwork, i) => (
                <tr
                  key={`${n.ssid}-${n.channel}-${i}`}
                  className="border-t border-border/40 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-2 font-mono text-foreground">{n.ssid || <em className="text-muted-foreground">(hidden)</em>}</td>
                  <td className={cn("px-4 py-2 font-mono", rssiColor(n.rssi))}>
                    <div className="inline-flex items-center gap-2">
                      <SignalBars bars={rssiBars(n.rssi)} />
                      {n.rssi} dBm
                    </div>
                  </td>
                  <td className="px-4 py-2 font-mono text-muted-foreground">{n.channel}</td>
                  <td className="px-4 py-2">
                    <span className="inline-block rounded border border-border bg-muted/40 px-2 py-0.5 font-mono text-xs">
                      {n.encryption}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SignalBars({ bars }: { bars: number }) {
  return (
    <span className="inline-flex items-end gap-0.5 h-3">
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn(
            "w-0.5 rounded-sm",
            i <= bars ? "bg-current" : "bg-current/20"
          )}
          style={{ height: `${i * 25}%` }}
        />
      ))}
    </span>
  );
}

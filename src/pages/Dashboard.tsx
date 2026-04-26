import { useEffect } from "react";
import { useSerial } from "@/context/SerialContext";
import { StatusCard } from "@/components/StatusCard";
import { Terminal } from "@/components/Terminal";
import { CommandButtons } from "@/components/CommandButtons";
import { Cpu, Wifi, Signal, TerminalSquare, Clock, History } from "lucide-react";

export default function Dashboard() {
  const { status, lastCommand, wifi, portInfo, lines } = useSerial();

  useEffect(() => {
    document.title = "ESP32 Dashboard · Web Serial Console";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Control your ESP32 over USB Serial: live terminal, WiFi scanner, status cards. Chrome/Edge.");
  }, []);

  const strongest = wifi.length ? wifi.reduce((a, b) => (a.rssi > b.rssi ? a : b)) : null;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-mono text-2xl font-bold tracking-tight">
          <span className="text-primary text-glow-primary">//</span> Mission Control
        </h1>
        <p className="text-sm text-muted-foreground">Real-time overview of your connected ESP32 device.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          label="Connection"
          value={status === "connected" ? "ONLINE" : status.toUpperCase()}
          hint={portInfo ?? "No device"}
          icon={<Cpu className="h-4 w-4" />}
          accent={status === "connected" ? "primary" : "muted"}
        />
        <StatusCard
          label="Last Command"
          value={lastCommand ?? "—"}
          hint={lastCommand ? "Sent to firmware" : "No command yet"}
          icon={<History className="h-4 w-4" />}
          accent="secondary"
        />
        <StatusCard
          label="Top Signal"
          value={strongest ? `${strongest.rssi} dBm` : "—"}
          hint={strongest ? strongest.ssid : "Run a WiFi scan"}
          icon={<Signal className="h-4 w-4" />}
          accent={strongest ? "primary" : "muted"}
        />
        <StatusCard
          label="Networks"
          value={wifi.length}
          hint={wifi.length ? "Scan results" : "No scan data"}
          icon={<Wifi className="h-4 w-4" />}
          accent="secondary"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TerminalSquare className="h-4 w-4 text-primary" />
            <h2 className="font-mono text-sm uppercase tracking-wider">Live Terminal</h2>
            <span className="text-xs text-muted-foreground font-mono">
              {lines.length} lines
            </span>
          </div>
          <Terminal />
        </div>

        <aside className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-secondary" />
            <h2 className="font-mono text-sm uppercase tracking-wider">Quick Actions</h2>
          </div>
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur p-4">
            <CommandButtons categories={["system", "wifi_scan"]} />
          </div>
        </aside>
      </section>
    </div>
  );
}

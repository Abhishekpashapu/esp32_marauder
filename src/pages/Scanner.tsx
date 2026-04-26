import { useEffect } from "react";
import { WifiTable } from "@/components/WifiTable";
import { Terminal } from "@/components/Terminal";
import { StatusCard } from "@/components/StatusCard";
import { useSerial } from "@/context/SerialContext";
import { Radar, Wifi, Lock, Activity } from "lucide-react";

export default function Scanner() {
  const { wifi, lastWifiUpdate } = useSerial();

  useEffect(() => {
    document.title = "WiFi Scanner · ESP32";
  }, []);

  const open = wifi.filter((n) => /open/i.test(n.encryption)).length;
  const channels = new Set(wifi.map((n) => n.channel)).size;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight">
            <span className="text-primary text-glow-primary">//</span> WiFi Scanner
          </h1>
          <p className="text-sm text-muted-foreground">Parsed from live serial output.</p>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard label="Networks" value={wifi.length} icon={<Wifi className="h-4 w-4" />} accent="primary" />
        <StatusCard label="Open APs" value={open} hint="Unencrypted" icon={<Lock className="h-4 w-4" />} accent={open ? "warning" : "muted"} />
        <StatusCard label="Channels" value={channels} icon={<Radar className="h-4 w-4" />} accent="secondary" />
        <StatusCard
          label="Last Scan"
          value={lastWifiUpdate ? new Date(lastWifiUpdate).toLocaleTimeString() : "—"}
          icon={<Activity className="h-4 w-4" />}
          accent="muted"
        />
      </section>

      <WifiTable />

      <section className="space-y-3">
        <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Raw Output</h2>
        <Terminal height="h-[280px]" />
      </section>
    </div>
  );
}

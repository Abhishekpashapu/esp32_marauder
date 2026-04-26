import { useEffect } from "react";
import { Terminal } from "@/components/Terminal";
import { Button } from "@/components/ui/button";
import { useSerial } from "@/context/SerialContext";
import { Play, Square, Activity } from "lucide-react";

export default function Monitor() {
  const { send, status, lines } = useSerial();
  const isConnected = status === "connected";

  useEffect(() => {
    document.title = "Monitor · ESP32";
  }, []);

  const errors = lines.filter((l) => l.level === "error").length;
  const warnings = lines.filter((l) => l.level === "warn").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight">
            <span className="text-primary text-glow-primary">//</span> Live Monitor
          </h1>
          <p className="text-sm text-muted-foreground">Stream raw firmware output and trigger monitoring tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => send("monitor start")} disabled={!isConnected} variant="hero" size="sm">
            <Play className="h-4 w-4" />
            Start
          </Button>
          <Button onClick={() => send("monitor stop")} disabled={!isConnected} variant="danger" size="sm">
            <Square className="h-4 w-4" />
            Stop
          </Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Lines" value={lines.length} accent="text-primary" />
        <Stat label="Warnings" value={warnings} accent={warnings ? "text-warning" : "text-muted-foreground"} />
        <Stat label="Errors" value={errors} accent={errors ? "text-destructive" : "text-muted-foreground"} />
      </section>

      <Terminal height="h-[560px]" />

      <p className="text-xs text-muted-foreground font-mono flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-primary" />
        Important logs are highlighted: <span className="text-destructive">errors</span>,{" "}
        <span className="text-warning">warnings</span>, <span className="text-primary">ok</span>.
      </p>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={`font-mono text-2xl font-semibold ${accent}`}>{value}</div>
    </div>
  );
}

import { useEffect } from "react";
import { CommandButtons } from "@/components/CommandButtons";
import { Terminal } from "@/components/Terminal";
import { useSerial } from "@/context/SerialContext";
import { History } from "lucide-react";

export default function Control() {
  const { history, send, status } = useSerial();

  useEffect(() => {
    document.title = "Control · ESP32";
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-mono text-2xl font-bold tracking-tight">
          <span className="text-primary text-glow-primary">//</span> Control Panel
        </h1>
        <p className="text-sm text-muted-foreground">All firmware commands grouped by domain.</p>
      </header>

      <section className="rounded-xl border border-border bg-card/60 backdrop-blur p-5">
        <CommandButtons />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Terminal</h2>
          <Terminal height="h-[420px]" />
        </div>
        <aside className="space-y-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-secondary" />
            <h2 className="font-mono text-sm uppercase tracking-wider">Recent</h2>
          </div>
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur p-2 max-h-[420px] overflow-y-auto">
            {history.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground font-mono">No commands sent yet.</p>
            ) : (
              <ul className="space-y-1">
                {history.map((cmd, i) => (
                  <li key={`${cmd}-${i}`}>
                    <button
                      onClick={() => send(cmd)}
                      disabled={status !== "connected"}
                      className="w-full text-left font-mono text-xs px-2 py-1.5 rounded hover:bg-primary/10 hover:text-primary disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-current truncate"
                      title={cmd}
                    >
                      <span className="text-primary mr-2">›</span>{cmd}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}

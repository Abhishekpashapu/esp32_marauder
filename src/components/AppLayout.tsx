import { NavLink, Outlet } from "react-router-dom";
import { SerialConnect } from "@/components/SerialConnect";
import { useSerial } from "@/context/SerialContext";
import { LayoutDashboard, Radar, Activity, SlidersHorizontal, AlertTriangle, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/scanner", label: "WiFi Scanner", icon: Radar },
  { to: "/monitor", label: "Monitor", icon: Activity },
  { to: "/control", label: "Control", icon: SlidersHorizontal },
];

export function AppLayout() {
  const { status, supported } = useSerial();
  const isConnected = status === "connected";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow-primary">
              <Cpu className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-sm font-bold tracking-wider text-glow-primary text-primary">
                ESP32 //CTRL
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hidden sm:block">
                Web Serial Operations Console
              </div>
            </div>
          </div>
          <SerialConnect />
        </div>

        {!supported && (
          <div className="border-t border-destructive/40 bg-destructive/10">
            <div className="container flex items-center gap-2 py-2 text-xs text-destructive font-mono">
              <AlertTriangle className="h-3.5 w-3.5" />
              Web Serial API is not available in this browser. Use Chrome or Edge on desktop.
            </div>
          </div>
        )}
        {supported && !isConnected && (
          <div className="border-t border-warning/30 bg-warning/5">
            <div className="container flex items-center gap-2 py-2 text-xs text-warning font-mono">
              <AlertTriangle className="h-3.5 w-3.5" />
              Device not connected · commands disabled until you connect via USB.
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 container py-6 grid gap-6 md:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="md:sticky md:top-32 md:self-start">
          <nav className="rounded-xl border border-border bg-card/40 backdrop-blur p-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-mono transition-all",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/30 shadow-glow-primary"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 rounded-xl border border-border/60 bg-card/30 p-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono space-y-1">
            <div className="flex items-center justify-between">
              <span>Baud</span><span className="text-foreground">115200</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Frame</span><span className="text-foreground">8N1</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className={cn(isConnected ? "text-primary" : "text-muted-foreground")}>
                {isConnected ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </aside>

        <main className="min-w-0 animate-slide-up">
          <Outlet />
        </main>
      </div>

      <footer className="border-t border-border/60 py-4">
        <div className="container text-center text-[11px] font-mono text-muted-foreground">
          ESP32 Control · Web Serial API · 115200 8N1 · Chrome / Edge only
        </div>
      </footer>
    </div>
  );
}

import { useMemo } from "react";
import { useSerial } from "@/context/SerialContext";
import { Button } from "@/components/ui/button";
import { COMMANDS, commandsByCategory, type CommandCategory, type CommandSpec } from "@/lib/commands";
import {
  Cpu,
  Radar,
  Eye,
  Swords,
  Bluetooth,
  HardDrive,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_META: Record<CommandCategory, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  system: { label: "System", icon: Cpu },
  wifi_scan: { label: "Wi-Fi Scanning", icon: Radar },
  sniffing: { label: "Sniffing", icon: Eye },
  wifi_attacks: { label: "Wi-Fi Attacks", icon: Swords },
  bluetooth: { label: "Bluetooth / BLE", icon: Bluetooth },
  storage: { label: "Data / Storage", icon: HardDrive },
  gps: { label: "GPS & Tracking", icon: MapPin },
};

function variantFor(spec: CommandSpec) {
  switch (spec.variant) {
    case "primary": return "neon" as const;
    case "secondary": return "cyber" as const;
    case "warning": return "warning" as const;
    case "danger": return "danger" as const;
    default: return "outline" as const;
  }
}

interface CommandButtonsProps {
  categories?: CommandCategory[];
  className?: string;
}

export function CommandButtons({ categories, className }: CommandButtonsProps) {
  const { send, status, lastCommand } = useSerial();
  const isConnected = status === "connected";

  const groups = useMemo(() => {
    const all = commandsByCategory();
    const keys = (categories ?? (Object.keys(CATEGORY_META) as CommandCategory[])) as CommandCategory[];
    return keys.map((k) => ({ key: k, items: all[k] ?? [] })).filter((g) => g.items.length);
  }, [categories]);

  const handleClick = (c: CommandSpec) => {
    if (c.argHint) {
      const arg = window.prompt(`${c.label}\n\n${c.description ?? ""}\n\nEnter ${c.argHint}:`);
      if (arg === null) return;
      const trimmed = arg.trim();
      const full = trimmed ? `${c.command} ${trimmed}` : c.command;
      send(full);
    } else {
      send(c.command);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {groups.map(({ key, items }) => {
        const Meta = CATEGORY_META[key];
        const Icon = Meta.icon;
        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
              <Icon className="h-3.5 w-3.5 text-primary" />
              {Meta.label}
              <span className="text-[10px] tracking-normal text-muted-foreground/60">({items.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {items.map((c) => (
                <Button
                  key={c.id}
                  variant={variantFor(c)}
                  size="sm"
                  disabled={!isConnected}
                  onClick={() => handleClick(c)}
                  title={c.description ? `${c.command} — ${c.description}` : c.command}
                  className={cn(
                    "font-mono",
                    lastCommand?.startsWith(c.command) && "ring-2 ring-primary/60"
                  )}
                >
                  {c.label}
                  {c.argHint && <span className="ml-1 opacity-60">…</span>}
                </Button>
              ))}
            </div>
          </div>
        );
      })}
      {!isConnected && (
        <p className="text-xs text-muted-foreground font-mono">
          Connect to ESP32 to enable commands ({COMMANDS.length} available).
        </p>
      )}
    </div>
  );
}
